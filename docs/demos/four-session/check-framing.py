"""Probe the recorded B workspace, without changing its code or evidence.

Usage: <isolated-python> check-framing.py /path/to/off-follower
Requires the workspace's runtime dependencies and original demo test file.
"""
import hashlib
import json
import os
from pathlib import Path
import runpy
import socket
import sys
import tempfile

workspace = Path(sys.argv[1]).resolve()
sys.path[:0] = [str(workspace / p) for p in (
    "src", "distributions/memory-contracts/src", "distributions/memory-client/src",
    "distributions/memory-runtime/src")]
os.environ["PYTHONPATH"] = os.pathsep.join(sys.path)
helpers = runpy.run_path(str(workspace / "tests/test_http_length_demo.py"))
with tempfile.TemporaryDirectory(prefix="cm-framing-", dir="/tmp") as temporary:
    process, endpoint = helpers["_spawn"](Path(temporary))
    try:
        token = Path(endpoint["token_file"]).read_text().strip()
        headers = ("Host: localhost\r\nConnection: keep-alive\r\n"
                   "X-CrowdMemory-Protocol-Major: 1\r\n"
                   f"X-CrowdMemory-Adapter-Token: {token}\r\n")
        # One sendall deliberately places both requests in the same receive buffer.
        request = ("POST /v1/agent-ingress/dsh/events/session.start HTTP/1.1\r\n"
                   + headers + "Content-Length: abc\r\n\r\n"
                   + "GET /v1/status HTTP/1.1\r\n" + headers + "\r\n")
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
            client.settimeout(5)
            client.connect(endpoint["socket_path"])
            client.sendall(request.encode())
            chunks = []
            termination = "eof"
            try:
                while chunk := client.recv(65536):
                    chunks.append(chunk)
            except ConnectionResetError:
                termination = "reset"
        response = b"".join(chunks)
        head, _, body = response.partition(b"\r\n\r\n")
        value = json.loads(body)
        assert head.startswith(b"HTTP/1.0 400 "), head
        assert value["error"]["code"] == "invalid_content_length", value
        assert response.count(b"HTTP/1.") == 1, response
        print(json.dumps({
            "workspace_server_sha256": hashlib.sha256((workspace /
                "distributions/memory-runtime/src/crowdmemory_runtime/server.py").read_bytes()).hexdigest(),
            "request_protocol": "HTTP/1.1", "connection_header": "keep-alive",
            "pipelined_requests": 2, "response_status_line": head.split(b"\r\n")[0].decode(),
            "response_count": 1, "error_code": value["error"]["code"],
            "connection_termination": termination,
            "scope": "recorded B handler only; not a guarantee for HTTP/1.1-enabled variants"
        }, indent=2))
    finally:
        helpers["_stop"](process)
