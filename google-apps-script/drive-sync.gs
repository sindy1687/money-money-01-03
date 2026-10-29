/**
 * 記帳本 — 雲端硬碟同步（Google Apps Script Web App）
 *
 * 在 ROOT_FOLDER_ID 指定的雲端硬碟資料夾（記帳本網路硬碟）裡建立：
 *   記帳本網路硬碟/
 *     <使用者A>/
 *       data.json      ← 該使用者的所有資料
 *       圖片/           ← 該使用者上傳的圖片
 *     <使用者B>/
 *       ...
 *
 * 部署方式見 google-apps-script/README.md
 */

// 所有使用者資料夾都建在這個雲端硬碟資料夾裡（記帳本網路硬碟）
// 網址 https://drive.google.com/drive/folders/<這段就是 ID>
// 部署這支程式的帳號必須擁有這個資料夾，或有編輯權限
const ROOT_FOLDER_ID = '1TkNPPBG0dS5izbuumFTiSivZcHEqxxOf';
const ROOT_FOLDER_NAME = '記帳本雲端資料'; // 只有在沒設定 ROOT_FOLDER_ID 時才會自動建立
const IMAGE_FOLDER_NAME = '圖片';
const DATA_FILE_NAME = 'data.json';
const SESSION_DAYS = 30;
const HASH_ROUNDS = 500;

function doPost(e) {
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: '請求格式錯誤' });
  }
  try {
    return reply(handle(req));
  } catch (err) {
    return reply({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  return reply({ ok: true, service: '記帳本雲端硬碟同步', version: 1 });
}

function handle(req) {
  switch (req.action) {
    case 'register': return register(req.username, req.password);
    case 'login': return login(req.username, req.password);
    case 'logout': return logout(req.token);
    case 'status': return status(requireUser(req.token));
    case 'rev': return { ok: true, rev: getRev(requireUser(req.token)) };
    case 'listImages': return listImages(requireUser(req.token));
    case 'uploadImage': return uploadImage(requireUser(req.token), req.name, req.mimeType, req.base64);
    case 'saveData': return saveData(requireUser(req.token), req.json, req.images, req.baseRev, req.force);
    case 'loadData': return loadData(requireUser(req.token));
    case 'getImage': return getImage(requireUser(req.token), req.name);
    default: return { ok: false, error: '未知的動作：' + req.action };
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- 帳號 ----------

function normalizeUsername(name) {
  const u = String(name || '').trim();
  if (!/^[A-Za-z0-9_\-一-鿿]{2,30}$/.test(u)) {
    throw new Error('帳號需為 2–30 個字，只能使用中英文、數字、- 或 _');
  }
  return u;
}

function checkPassword(pw) {
  const p = String(pw || '');
  if (p.length < 6) throw new Error('密碼至少需要 6 個字元');
  return p;
}

function hashPassword(password, salt) {
  let bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + password, Utilities.Charset.UTF_8);
  for (let i = 0; i < HASH_ROUNDS; i++) {
    bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes.concat(Utilities.newBlob(salt).getBytes()));
  }
  return Utilities.base64Encode(bytes);
}

function userKey(username) {
  // 帳號不分大小寫
  return 'user:' + username.toLowerCase();
}

function getUser(username) {
  const raw = PropertiesService.getScriptProperties().getProperty(userKey(username));
  return raw ? JSON.parse(raw) : null;
}

function register(username, password) {
  const u = normalizeUsername(username);
  const p = checkPassword(password);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (getUser(u)) throw new Error('這個帳號已經有人使用');
    const salt = Utilities.getUuid();
    const folder = getRootFolder().createFolder(u);
    folder.createFolder(IMAGE_FOLDER_NAME);
    const user = { username: u, salt: salt, hash: hashPassword(p, salt), folderId: folder.getId(), created: new Date().toISOString() };
    PropertiesService.getScriptProperties().setProperty(userKey(u), JSON.stringify(user));
  } finally {
    lock.releaseLock();
  }
  return login(u, p);
}

function login(username, password) {
  const u = normalizeUsername(username);
  const user = getUser(u);
  if (!user || user.hash !== hashPassword(String(password || ''), user.salt)) {
    throw new Error('帳號或密碼錯誤');
  }
  cleanupSessions();
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  PropertiesService.getScriptProperties().setProperty('session:' + token, JSON.stringify({ username: user.username, exp: exp }));
  return Object.assign({ ok: true, token: token, username: user.username }, status(user));
}

function logout(token) {
  if (token) PropertiesService.getScriptProperties().deleteProperty('session:' + token);
  return { ok: true };
}

function requireUser(token) {
  const raw = token ? PropertiesService.getScriptProperties().getProperty('session:' + token) : null;
  const session = raw ? JSON.parse(raw) : null;
  if (!session || session.exp < Date.now()) throw new Error('登入已過期，請重新登入');
  const user = getUser(session.username);
  if (!user) throw new Error('帳號不存在');
  return user;
}

function cleanupSessions() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  const now = Date.now();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('session:') !== 0) return;
    try {
      if (JSON.parse(all[k]).exp < now) props.deleteProperty(k);
    } catch (e) {
      props.deleteProperty(k);
    }
  });
}

// ---------- 雲端硬碟 ----------

function getRootFolder() {
  if (ROOT_FOLDER_ID) {
    try {
      return DriveApp.getFolderById(ROOT_FOLDER_ID);
    } catch (e) {
      throw new Error('找不到指定的雲端硬碟資料夾，請確認部署帳號對它有編輯權限');
    }
  }
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('rootFolderId');
  if (id) {
    try {
      const f = DriveApp.getFolderById(id);
      if (!f.isTrashed()) return f;
    } catch (e) { /* 資料夾被刪掉了，重新建立 */ }
  }
  const folder = DriveApp.createFolder(ROOT_FOLDER_NAME);
  props.setProperty('rootFolderId', folder.getId());
  return folder;
}

function getUserFolder(user) {
  try {
    const f = DriveApp.getFolderById(user.folderId);
    if (!f.isTrashed()) return f;
  } catch (e) { /* 重新建立 */ }
  const folder = getRootFolder().createFolder(user.username);
  user.folderId = folder.getId();
  PropertiesService.getScriptProperties().setProperty(userKey(user.username), JSON.stringify(user));
  return folder;
}

function getChildFolder(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function getImageFolder(user) {
  return getChildFolder(getUserFolder(user), IMAGE_FOLDER_NAME);
}

function findFile(folder, name) {
  const it = folder.getFilesByName(name);
  return it.hasNext() ? it.next() : null;
}

function safeImageName(name) {
  const n = String(name || '');
  if (!/^[A-Za-z0-9_\-]{1,64}\.(png|jpg|jpeg|gif|webp|svg)$/.test(n)) throw new Error('圖片檔名不正確');
  return n;
}

// 每次儲存 data.json 版本號 +1，裝置用它判斷雲端有沒有新資料
function getRev(user) {
  return Number(PropertiesService.getScriptProperties().getProperty('rev:' + user.username.toLowerCase()) || 0);
}

function status(user) {
  const file = findFile(getUserFolder(user), DATA_FILE_NAME);
  return { ok: true, username: user.username, hasCloudData: !!file, cloudUpdatedAt: file ? file.getLastUpdated().toISOString() : null, rev: getRev(user) };
}

function listImages(user) {
  const names = [];
  const it = getImageFolder(user).getFiles();
  while (it.hasNext()) names.push(it.next().getName());
  return { ok: true, names: names };
}

function uploadImage(user, name, mimeType, base64) {
  const n = safeImageName(name);
  const folder = getImageFolder(user);
  if (!findFile(folder, n)) {
    const blob = Utilities.newBlob(Utilities.base64Decode(String(base64 || '')), String(mimeType || 'image/png'), n);
    folder.createFile(blob);
  }
  return { ok: true, name: n };
}

function saveData(user, json, images, baseRev, force) {
  if (typeof json !== 'string' || !json) throw new Error('沒有資料');
  JSON.parse(json); // 確認是合法 JSON
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let rev;
  try {
    // 其他裝置在這之後已經上傳過：不覆蓋，讓裝置決定要下載還是強制覆蓋
    const current = getRev(user);
    if (!force && baseRev != null && Number(baseRev) !== current) {
      return { ok: false, conflict: true, rev: current, error: '雲端有其他裝置更新的資料' };
    }
    const folder = getUserFolder(user);
    const existing = findFile(folder, DATA_FILE_NAME);
    if (existing) existing.setContent(json);
    else folder.createFile(DATA_FILE_NAME, json, 'application/json');
    rev = current + 1;
    PropertiesService.getScriptProperties().setProperty('rev:' + user.username.toLowerCase(), String(rev));
  } finally {
    lock.releaseLock();
  }

  // 已經沒有用到的圖片移到垃圾桶（30 天內可從垃圾桶救回）
  if (Array.isArray(images)) {
    const keep = {};
    images.forEach(function (n) { keep[n] = true; });
    const it = getImageFolder(user).getFiles();
    while (it.hasNext()) {
      const f = it.next();
      if (!keep[f.getName()]) f.setTrashed(true);
    }
  }
  return { ok: true, rev: rev };
}

function loadData(user) {
  const file = findFile(getUserFolder(user), DATA_FILE_NAME);
  if (!file) return { ok: false, error: '雲端還沒有這個帳號的資料' };
  return { ok: true, json: file.getBlob().getDataAsString('UTF-8'), cloudUpdatedAt: file.getLastUpdated().toISOString(), rev: getRev(user) };
}

function getImage(user, name) {
  const file = findFile(getImageFolder(user), safeImageName(name));
  if (!file) return { ok: false, error: '找不到圖片：' + name };
  const blob = file.getBlob();
  return { ok: true, name: name, mimeType: blob.getContentType(), base64: Utilities.base64Encode(blob.getBytes()) };
}
