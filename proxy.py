from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route("/api/quote")
def quote():
    symbols = request.args.get("symbols")
    if not symbols:
        return jsonify({"error": "missing symbols query parameter"}), 400

    yahoo_url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={symbols}"
    try:
        resp = requests.get(yahoo_url, timeout=10)
    except requests.RequestException as exc:
        return jsonify({"error": "failed to reach Yahoo Finance", "details": str(exc)}), 502

    headers = {k: v for k, v in resp.headers.items() if k.lower() in ("content-type", "content-length", "cache-control")}
    return (resp.content, resp.status_code, headers.items())

if __name__ == "__main__":
    app.run(port=5000)
