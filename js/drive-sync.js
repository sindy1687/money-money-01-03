// 雲端硬碟同步：登入後把所有資料存成一個 data.json，圖片放進使用者資料夾裡的「圖片」資料夾
// 資料一有變動就自動上傳；雲端有其他裝置的新資料就自動下載
// 後端程式：google-apps-script/drive-sync.gs

const DriveSync = (() => {
    const URL_KEY = 'driveSyncUrl';
    const SESSION_KEY = 'driveSyncSession';
    const REV_KEY = 'driveSyncRev';       // 這台裝置目前資料對應的雲端版本號
    const DIRTY_KEY = 'driveSyncDirty';   // 有尚未上傳的變更
    const IMAGE_REF_PREFIX = 'drive-image:圖片/';
    const DATA_URL_RE = /^data:(image\/(png|jpe?g|gif|webp|svg\+xml));base64,([A-Za-z0-9+/=\s]+)$/;

    const UPLOAD_DELAY_MS = 3000;   // 最後一次變動後等多久才上傳
    const CHECK_INTERVAL_MS = 60000; // 多久檢查一次雲端有沒有新資料

    // 這些是這台裝置自己的設定，不上傳也不覆蓋
    const LOCAL_ONLY_KEYS = new Set([URL_KEY, SESSION_KEY, REV_KEY, DIRTY_KEY, 'googleSheetUploadUrl', 'googleCloudBackupKey']);
    // 這些會自己一直更新（股價、畫面狀態等），變動時不觸發上傳，但上傳時仍會一起帶上
    const NO_TRIGGER_KEYS = new Set(['stockCurrentPrices', 'stockPreviousClosePrices', 'logs', 'selectedMonthKey', 'budgetSelectedMonthKey']);

    // 先保留原本的 localStorage 方法，同步程式自己寫入時不算使用者變更
    const rawSetItem = Storage.prototype.setItem;
    const rawRemoveItem = Storage.prototype.removeItem;
    const rawClear = Storage.prototype.clear;

    // 預設的雲端硬碟同步網址（drive-sync.gs 的部署網址），不用每台裝置手動設定
    const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbygZqoe9jhgRTJY1uyzJXfL_Hh6zKqIcVyr1cb5vvV9BJHKYQ0sU_0Ovh9usCQVK5bkXA/exec';

    const getUrl = () => (localStorage.getItem(URL_KEY) || DEFAULT_URL).trim();

    const getSession = () => {
        try {
            const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
            return s && s.token && s.username ? s : null;
        } catch (e) {
            return null;
        }
    };

    const setSession = (s) => {
        if (s) rawSetItem.call(localStorage, SESSION_KEY, JSON.stringify({ token: s.token, username: s.username }));
        else rawRemoveItem.call(localStorage, SESSION_KEY);
    };

    const getRev = () => {
        const v = localStorage.getItem(REV_KEY);
        return v === null ? null : Number(v);
    };
    const setRev = (rev) => rawSetItem.call(localStorage, REV_KEY, String(rev));
    const isDirty = () => localStorage.getItem(DIRTY_KEY) === '1';
    const setDirty = (v) => (v ? rawSetItem.call(localStorage, DIRTY_KEY, '1') : rawRemoveItem.call(localStorage, DIRTY_KEY));

    async function call(action, params = {}) {
        const url = getUrl();
        if (!url) throw new Error('尚未設定雲端硬碟網址');
        const session = getSession();
        // text/plain 不會觸發 CORS 預檢，Apps Script 才收得到
        let data;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action, token: session ? session.token : undefined, ...params })
            });
            data = await res.json();
        } catch (e) {
            // Google 拒絕存取時回傳的錯誤頁沒有 CORS 標頭，瀏覽器只會看到連線失敗
            const err = new Error('無法連線到雲端硬碟服務。\n\n請確認 Apps Script 部署時「誰可以存取」設為「所有人」，且網址是 /exec 結尾的部署網址。');
            err.network = true;
            throw err;
        }
        if (!data.ok) {
            if (/登入已過期|帳號不存在/.test(data.error || '')) {
                setSession(null);
                refreshSettings();
            }
            const err = new Error(data.error || '雲端回應錯誤');
            err.conflict = !!data.conflict;
            err.rev = data.rev;
            throw err;
        }
        return data;
    }

    // ---------- 資料 <-> JSON ----------

    function hashString(s) {
        // 兩組 FNV-1a，產生 16 碼檔名，相同圖片會得到相同檔名
        let h1 = 0x811c9dc5, h2 = 0x01000193 ^ s.length;
        for (let i = 0; i < s.length; i++) {
            const c = s.charCodeAt(i);
            h1 = Math.imul(h1 ^ c, 16777619);
            h2 = Math.imul(h2 ^ c, 2246822519);
        }
        return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
    }

    function extOf(mime) {
        if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
        if (mime === 'image/svg+xml') return 'svg';
        return mime.split('/')[1];
    }

    // 把資料裡的 data:image 換成圖片檔參照
    function extractImages(value, images) {
        if (typeof value === 'string') {
            const m = value.match(DATA_URL_RE);
            if (!m) return value;
            const name = `${hashString(value)}.${extOf(m[1])}`;
            images.set(name, { mimeType: m[1], base64: m[3].replace(/\s/g, '') });
            return IMAGE_REF_PREFIX + name;
        }
        if (Array.isArray(value)) return value.map(v => extractImages(v, images));
        if (value && typeof value === 'object') {
            const out = {};
            Object.keys(value).forEach(k => { out[k] = extractImages(value[k], images); });
            return out;
        }
        return value;
    }

    function collectImageRefs(value, names) {
        if (typeof value === 'string') {
            if (value.startsWith(IMAGE_REF_PREFIX)) names.add(value.slice(IMAGE_REF_PREFIX.length));
        } else if (Array.isArray(value)) {
            value.forEach(v => collectImageRefs(v, names));
        } else if (value && typeof value === 'object') {
            Object.keys(value).forEach(k => collectImageRefs(value[k], names));
        }
    }

    function restoreImages(value, dataUrls) {
        if (typeof value === 'string') {
            if (!value.startsWith(IMAGE_REF_PREFIX)) return value;
            return dataUrls.get(value.slice(IMAGE_REF_PREFIX.length)) || '';
        }
        if (Array.isArray(value)) return value.map(v => restoreImages(v, dataUrls));
        if (value && typeof value === 'object') {
            const out = {};
            Object.keys(value).forEach(k => { out[k] = restoreImages(value[k], dataUrls); });
            return out;
        }
        return value;
    }

    function buildSnapshot(username) {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (LOCAL_ONLY_KEYS.has(key)) continue;
            const raw = localStorage.getItem(key);
            let value = raw;
            try {
                const parsed = JSON.parse(raw);
                // 純文字照原樣保存，物件、陣列、數字等存成 JSON
                if (typeof parsed !== 'string') value = parsed;
            } catch (e) { /* 不是 JSON，保留文字 */ }
            data[key] = value;
        }
        const images = new Map();
        const snapshot = {
            app: '記帳本',
            version: 1,
            username,
            exportedAt: new Date().toISOString(),
            data: extractImages(data, images)
        };
        return { snapshot, images };
    }

    function writeSnapshot(data) {
        Object.keys(data).forEach(key => {
            if (LOCAL_ONLY_KEYS.has(key)) return;
            const v = data[key];
            rawSetItem.call(localStorage, key, typeof v === 'string' ? v : JSON.stringify(v));
        });
    }

    // ---------- 提示 ----------

    let toastEl = null;
    let toastTimer = null;
    function showToast(text, autoHideMs = 0) {
        if (!document.body) return;
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:10050;' +
                'background:rgba(0,0,0,0.82);color:#fff;padding:10px 16px;border-radius:12px;font-size:14px;' +
                'max-width:calc(100vw - 32px);box-shadow:0 6px 20px rgba(0,0,0,0.3);pointer-events:none;';
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = text;
        clearTimeout(toastTimer);
        if (autoHideMs) toastTimer = setTimeout(hideToast, autoHideMs);
    }
    function hideToast() {
        clearTimeout(toastTimer);
        if (toastEl) toastEl.remove();
        toastEl = null;
    }

    // ---------- 上傳 / 下載 ----------

    let busy = false;            // 正在上傳或下载
    let knownImages = null;      // 雲端已有的圖片檔名（第一次上傳時向雲端查詢）

    // auto：自動同步時只顯示小提示，不跳出對話框
    async function upload({ auto = false, force = false } = {}) {
        const session = getSession();
        if (!session) {
            if (!auto) showLoginModal();
            return false;
        }
        if (busy) {
            if (auto) scheduleUpload();
            return false;
        }
        busy = true;
        try {
            showToast(auto ? '☁️ 同步中...' : '正在準備資料...');
            const { snapshot, images } = buildSnapshot(session.username);
            if (!knownImages) knownImages = new Set((await call('listImages')).names);
            const toUpload = [...images.entries()].filter(([name]) => !knownImages.has(name));
            for (let i = 0; i < toUpload.length; i++) {
                const [name, img] = toUpload[i];
                showToast(`☁️ 正在上傳圖片 ${i + 1} / ${toUpload.length}...`);
                await call('uploadImage', { name, mimeType: img.mimeType, base64: img.base64 });
                knownImages.add(name);
            }
            showToast(auto ? '☁️ 同步中...' : '正在上傳資料...');
            // 上傳期間又有新變更，就保留 dirty 讓下一輪再傳
            setDirty(false);
            const res = await call('saveData', {
                json: JSON.stringify(snapshot, null, 2),
                images: [...images.keys()],
                // 還沒跟雲端對過版本時用 0：雲端已有資料就會回報衝突，不會直接覆蓋
                baseRev: getRev() === null ? 0 : getRev(),
                force
            });
            setRev(res.rev);
            knownImages = new Set(images.keys());
            if (auto) showToast('☁️ 已同步', 1500);
            else {
                hideToast();
                alert(`✅ 已上傳到雲端硬碟\n\n帳號：${session.username}\n圖片：${images.size} 張（新上傳 ${toUpload.length} 張）`);
            }
            return true;
        } catch (e) {
            setDirty(true);
            if (e.conflict) {
                hideToast();
                busy = false;
                return await resolveConflict();
            }
            if (auto) showToast('⚠️ 雲端同步失敗，稍後會再試', 3000);
            else {
                hideToast();
                alert('上傳失敗：' + e.message);
            }
            return false;
        } finally {
            busy = false;
        }
    }

    async function restore({ skipConfirm = false, auto = false } = {}) {
        const session = getSession();
        if (!session) {
            showLoginModal();
            return false;
        }
        if (!skipConfirm && !confirm(`確定要用雲端硬碟上「${session.username}」的資料覆蓋這台裝置嗎？\n\n這台裝置目前的資料會被取代！`)) {
            return false;
        }
        if (busy) return false;
        busy = true;
        try {
            showToast(auto ? '☁️ 雲端有新資料，正在更新...' : '正在下載資料...');
            const { json, rev } = await call('loadData');
            const snapshot = JSON.parse(json);
            if (!snapshot || snapshot.app !== '記帳本' || !snapshot.data) throw new Error('雲端資料格式不正確');

            const names = new Set();
            collectImageRefs(snapshot.data, names);
            const dataUrls = new Map();
            const list = [...names];
            for (let i = 0; i < list.length; i++) {
                showToast(`☁️ 正在下載圖片 ${i + 1} / ${list.length}...`);
                try {
                    const img = await call('getImage', { name: list[i] });
                    dataUrls.set(list[i], `data:${img.mimeType};base64,${img.base64}`);
                } catch (e) {
                    console.warn('圖片下載失敗', list[i], e);
                }
            }

            const data = restoreImages(snapshot.data, dataUrls);
            const backup = {};
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                backup[k] = localStorage.getItem(k);
            }
            try {
                writeSnapshot(data);
            } catch (e) {
                // 空間不足等問題：還原回原本的資料
                rawClear.call(localStorage);
                Object.keys(backup).forEach(k => rawSetItem.call(localStorage, k, backup[k]));
                throw new Error('這台裝置的儲存空間不足，已保留原本的資料');
            }
            setRev(rev);
            setDirty(false);
            clearTimeout(uploadTimer);
            hideToast();
            if (auto) {
                try { sessionStorage.setItem('driveSyncJustUpdated', '1'); } catch (e) {}
            } else {
                alert('✅ 已從雲端硬碟還原，頁面將重新整理');
            }
            location.reload();
            return true;
        } catch (e) {
            hideToast();
            if (auto) showToast('⚠️ 下載雲端資料失敗，稍後會再試', 3000);
            else alert('還原失敗：' + e.message);
            return false;
        } finally {
            busy = false;
        }
    }

    // 這台和雲端都有新變更時，讓使用者選擇保留哪一邊
    let resolvingConflict = false;
    async function resolveConflict(reason = '另一台裝置已經更新了雲端資料，這台裝置也有尚未上傳的變更。') {
        if (resolvingConflict) return false;
        resolvingConflict = true;
        try {
            const useCloud = confirm(
                reason + '\n\n' +
                '按「確定」：下載雲端資料（放棄這台裝置的變更）\n' +
                '按「取消」：用這台裝置的資料覆蓋雲端'
            );
            if (useCloud) return await restore({ skipConfirm: true });
            return await upload({ force: true });
        } finally {
            resolvingConflict = false;
        }
    }

    // ---------- 自動同步 ----------

    let uploadTimer = null;
    function scheduleUpload() {
        clearTimeout(uploadTimer);
        uploadTimer = setTimeout(() => upload({ auto: true }), UPLOAD_DELAY_MS);
    }

    function onLocalChange(key) {
        if (LOCAL_ONLY_KEYS.has(key) || NO_TRIGGER_KEYS.has(key)) return;
        if (!getSession()) return;
        setDirty(true);
        scheduleUpload();
    }

    // 攔截 localStorage 寫入，只有值真的改變才算變更
    Storage.prototype.setItem = function (key, value) {
        if (this !== localStorage) return rawSetItem.call(this, key, value);
        const before = this.getItem(key);
        rawSetItem.call(this, key, value);
        if (before !== String(value)) onLocalChange(String(key));
    };
    Storage.prototype.removeItem = function (key) {
        if (this !== localStorage) return rawRemoveItem.call(this, key);
        const existed = this.getItem(key) !== null;
        rawRemoveItem.call(this, key);
        if (existed) onLocalChange(String(key));
    };
    Storage.prototype.clear = function () {
        if (this !== localStorage) return rawClear.call(this);
        // 清除全部資料時保留登入與同步設定，避免被登出
        const keep = {};
        LOCAL_ONLY_KEYS.forEach(k => { const v = this.getItem(k); if (v !== null) keep[k] = v; });
        rawClear.call(this);
        Object.keys(keep).forEach(k => rawSetItem.call(this, k, keep[k]));
        onLocalChange('*');
    };

    // 正在輸入或有視窗打開時，不要重新整理頁面打斷使用者
    function userIsBusy() {
        const el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return true;
        return !!document.querySelector('.drive-login-modal');
    }

    async function checkForCloudUpdate() {
        if (!getSession() || busy || resolvingConflict || document.hidden) return;
        try {
            const { rev } = await call('rev');
            const localRev = getRev();
            if (rev === 0) return; // 雲端還沒有資料
            if (localRev === null) {
                // 這台裝置還沒跟雲端對過版本（例如登入時兩邊都沒選），先問清楚再同步
                await resolveConflict('雲端硬碟上有資料，但這台裝置還沒跟雲端同步過。');
                return;
            }
            if (rev <= localRev) return;
            if (isDirty()) {
                await resolveConflict();
            } else if (!userIsBusy()) {
                await restore({ skipConfirm: true, auto: true });
            }
        } catch (e) {
            // 離線或暫時連不上：下次再檢查
        }
    }

    function startAutoSync() {
        setInterval(checkForCloudUpdate, CHECK_INTERVAL_MS);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) checkForCloudUpdate();
        });
        window.addEventListener('online', () => {
            if (isDirty()) scheduleUpload();
            checkForCloudUpdate();
        });

        const start = () => {
            try {
                if (sessionStorage.getItem('driveSyncJustUpdated')) {
                    sessionStorage.removeItem('driveSyncJustUpdated');
                    showToast('☁️ 已更新為雲端最新資料', 2500);
                }
            } catch (e) {}
            if (!getSession()) return;
            // 上次有沒傳完的變更就先上傳，否則檢查雲端有沒有新資料
            if (isDirty()) scheduleUpload();
            else checkForCloudUpdate();
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
        else start();
    }

    // ---------- 登入 / 登出 ----------

    // 登入後：雲端沒資料就直接上傳；雲端已有資料就讓使用者選擇
    async function afterLogin(result) {
        knownImages = null;
        if (!result.hasCloudData) {
            rawRemoveItem.call(localStorage, REV_KEY);
            await upload({ auto: true, force: true });
            alert(`✅ 歡迎，${result.username}！\n\n已在雲端硬碟建立你的資料夾，並上傳所有資料。\n之後資料一有變動就會自動上傳。`);
            return;
        }
        const when = result.cloudUpdatedAt ? new Date(result.cloudUpdatedAt).toLocaleString('zh-TW') : '未知';
        const useCloud = confirm(
            `雲端硬碟已經有「${result.username}」的資料（最後更新：${when}）。\n\n` +
            '按「確定」：下載雲端資料到這台裝置（取代這台裝置的資料）\n' +
            '按「取消」：把這台裝置的資料上傳到雲端（取代雲端的資料）'
        );
        if (useCloud) {
            await restore({ skipConfirm: true });
        } else if (confirm('確定要用這台裝置的資料取代雲端的資料嗎？')) {
            await upload({ force: true });
        } else {
            // 兩邊都不選：維持登入，但先不同步，下次檢查時會再詢問
            rawRemoveItem.call(localStorage, REV_KEY);
        }
    }

    async function logout() {
        const session = getSession();
        if (!session) return;
        const pending = isDirty() ? '\n\n⚠️ 還有尚未上傳的變更，登出後不會再自動上傳。' : '';
        if (!confirm(`要登出「${session.username}」嗎？\n\n這台裝置上的資料會保留。${pending}`)) return;
        try {
            await call('logout');
        } catch (e) { /* 離線也照樣登出 */ }
        clearTimeout(uploadTimer);
        setSession(null);
        rawRemoveItem.call(localStorage, REV_KEY);
        setDirty(false);
        knownImages = null;
        refreshSettings();
        alert('已登出');
    }

    function setUrl() {
        const next = prompt('請輸入雲端硬碟同步的 Apps Script 網址（/exec 結尾）', getUrl());
        if (next == null) return;
        const v = next.trim();
        if (v && !/^https:\/\/script\.google\.com\/.+\/exec$/.test(v)) {
            alert('網址格式不對，應該是 https://script.google.com/macros/s/.../exec');
            return;
        }
        if (v) rawSetItem.call(localStorage, URL_KEY, v);
        else rawRemoveItem.call(localStorage, URL_KEY);
        alert(v ? '已儲存雲端硬碟網址' : '已清除雲端硬碟網址');
    }

    function refreshSettings() {
        if (typeof initSettingsPage === 'function') initSettingsPage();
    }

    // ---------- 登入畫面 ----------

    function showLoginModal() {
        if (!getUrl()) {
            alert('請先設定雲端硬碟網址（部署 drive-sync.gs 後取得）');
            setUrl();
            if (!getUrl()) return;
        }
        const modal = document.createElement('div');
        modal.className = 'drive-login-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:10040;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:16px;';
        modal.innerHTML = `
            <form class="drive-login-card" style="width:100%;max-width:360px;background:var(--bg-white,#fff);color:var(--text-primary,#222);border-radius:18px;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,0.3);box-sizing:border-box;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="font-size:20px;font-weight:700;">☁️ 雲端硬碟帳號</div>
                    <button type="button" data-close style="background:none;border:none;font-size:20px;cursor:pointer;color:inherit;">✕</button>
                </div>
                <div style="font-size:13px;opacity:0.7;margin-bottom:16px;">登入後資料會自動同步到你在雲端硬碟的專屬資料夾</div>
                <label style="display:block;font-size:13px;margin-bottom:4px;">帳號</label>
                <input name="username" autocomplete="username" required minlength="2" maxlength="30" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid var(--border-light,#ccc);background:var(--bg-light,#fafafa);color:inherit;font-size:16px;margin-bottom:12px;">
                <label style="display:block;font-size:13px;margin-bottom:4px;">密碼</label>
                <input name="password" type="password" autocomplete="current-password" required minlength="6" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid var(--border-light,#ccc);background:var(--bg-light,#fafafa);color:inherit;font-size:16px;margin-bottom:8px;">
                <div data-error style="color:#e5484d;font-size:13px;min-height:18px;margin-bottom:8px;white-space:pre-line;"></div>
                <div style="display:flex;gap:10px;">
                    <button type="submit" data-mode="login" style="flex:1;padding:11px;border:none;border-radius:10px;background:var(--color-primary,#4a90e2);color:#fff;font-size:15px;font-weight:600;cursor:pointer;">登入</button>
                    <button type="submit" data-mode="register" style="flex:1;padding:11px;border-radius:10px;border:1px solid var(--color-primary,#4a90e2);background:transparent;color:var(--color-primary,#4a90e2);font-size:15px;font-weight:600;cursor:pointer;">註冊新帳號</button>
                </div>
            </form>
        `;
        document.body.appendChild(modal);

        const form = modal.querySelector('form');
        const errorEl = modal.querySelector('[data-error]');
        const close = () => modal.remove();
        modal.querySelector('[data-close]').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        let mode = 'login';
        form.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => { mode = btn.dataset.mode; }));
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = form.username.value.trim();
            const password = form.password.value;
            const buttons = form.querySelectorAll('button[type=submit]');
            buttons.forEach(b => { b.disabled = true; });
            errorEl.textContent = mode === 'register' ? '正在建立帳號與資料夾...' : '正在登入...';
            try {
                const result = await call(mode, { username, password });
                setSession(result);
                close();
                refreshSettings();
                await afterLogin(result);
            } catch (err) {
                errorEl.textContent = err.message;
            } finally {
                buttons.forEach(b => { b.disabled = false; });
            }
        });
        setTimeout(() => form.username.focus(), 0);
    }

    function accountMenu() {
        if (getSession()) logout();
        else showLoginModal();
    }

    startAutoSync();

    return {
        getSession,
        showLoginModal,
        accountMenu,
        upload,
        restore,
        logout,
        setUrl,
        checkForCloudUpdate,
        // 測試用
        _buildSnapshot: buildSnapshot,
        _restoreImages: restoreImages,
        _collectImageRefs: collectImageRefs
    };
})();

window.DriveSync = DriveSync;
