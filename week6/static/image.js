const form = document.querySelector("#image-form");
const status = document.querySelector("#status");
let originalURL = null;
let resultURL = null;
function clearResult() {
  if (resultURL) URL.revokeObjectURL(resultURL);
  resultURL = null;
  document.querySelector("#result").hidden = true;
  document.querySelector("#result").removeAttribute("src");
  document.querySelector("#download").hidden = true;
  document.querySelector("#download").removeAttribute("href");
  document.querySelector("#timing").textContent = "새 결과를 기다립니다.";
}
document.querySelector("#image").addEventListener("change", function () {
  clearResult();
  if (originalURL) URL.revokeObjectURL(originalURL);
  originalURL = null;
  const file = this.files[0];
  const preview = document.querySelector("#original");
  preview.hidden = !file;
  preview.removeAttribute("src");
  if (file) {
    originalURL = URL.createObjectURL(file);
    preview.src = originalURL;
  }
  status.textContent = "처리할 방법을 고르고 서버에서 처리를 누르세요.";
});
form.addEventListener("submit", async function (event) {
  // 이 버튼은 JavaScript 가로채기 없이 HTML form의 기본 제출을 사용합니다.
  if (event.submitter && event.submitter.id === "native") return;
  event.preventDefault();
  const data = new FormData(form); // 비활성화 전에 입력을 담습니다.
  const controls = document.querySelector("#controls");
  clearResult();
  controls.disabled = true;
  status.textContent = "Processing... 서버에서 처리 중입니다.";
  const started = performance.now();
  try {
    const response = await fetch("/api/process", { method: "POST", body: data });
    if (!response.ok) {
      let message = "처리에 실패했습니다. HTTP " + response.status;
      if ((response.headers.get("Content-Type") || "").includes("application/json")) {
        const error = await response.json();
        message = error.error || message;
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    resultURL = URL.createObjectURL(blob);
    document.querySelector("#result").src = resultURL;
    document.querySelector("#result").hidden = false;
    document.querySelector("#download").href = resultURL;
    document.querySelector("#download").hidden = false;
    const roundTrip = performance.now() - started;
    document.querySelector("#timing").textContent =
      "알고리즘 " + response.headers.get("X-Compute-Ms") + " ms · 서버 처리 " +
      response.headers.get("X-Processing-Ms") + " ms · 왕복 " + roundTrip.toFixed(1) + " ms";
    status.textContent = "완료 · 결과 크기 " + response.headers.get("X-Image-Size");
  } catch (error) {
    status.textContent = "처리하지 못했습니다. " + error.message + " 서버 실행 여부도 확인하세요.";
  } finally {
    controls.disabled = false;
  }
});

// 캠퍼스 사진 버튼: 서버의 static 사진을 받아 파일 선택 칸에 넣습니다.
// 이후 흐름(미리보기 → FormData → POST /api/process)은 직접 고른 사진과 똑같습니다.
document.querySelectorAll(".campus-pick").forEach(function (button) {
  button.addEventListener("click", async function () {
    const input = document.querySelector("#image");
    status.textContent = button.dataset.name + " 사진을 불러오는 중...";
    try {
      const response = await fetch("/static/campus/" + button.dataset.photo + ".jpg");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const blob = await response.blob();
      const file = new File([blob], button.dataset.photo + ".jpg", { type: "image/jpeg" });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      document.querySelectorAll(".campus-pick").forEach(function (other) {
        other.setAttribute("aria-pressed", String(other === button));
      });
      input.dispatchEvent(new Event("change"));
      status.textContent = button.dataset.name + " 사진을 골랐습니다. 처리 방법을 고르고 서버에서 처리를 누르세요.";
    } catch (error) {
      status.textContent = "캠퍼스 사진을 불러오지 못했습니다. " + error.message + " 직접 사진을 선택해 주세요.";
    }
  });
});
// 사용자가 직접 파일을 고르면 캠퍼스 버튼 선택 표시를 끕니다(코드로 보낸 change는 isTrusted가 false).
document.querySelector("#image").addEventListener("change", function (event) {
  if (!event.isTrusted) return;
  document.querySelectorAll(".campus-pick").forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
});
