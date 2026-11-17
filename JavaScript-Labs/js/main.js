function updateClock() {
  var now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleDateString("vi-VN") + " " + now.toLocaleTimeString("vi-VN");
}
updateClock();
setInterval(updateClock, 1000);
document.getElementById("year").textContent = new Date().getFullYear();

// Nếu chưa có ảnh đại diện thì hiện chữ VY
var avatar = document.getElementById("avatar");
avatar.addEventListener("error", function () {
  var box = document.createElement("div");
  box.className = "avatar-fallback";
  box.textContent = "VY";
  avatar.replaceWith(box);
});

// Nút lên đầu trang
var toTop = document.getElementById("toTop");
window.addEventListener("scroll", function () {
  toTop.hidden = window.scrollY < 300;
});
toTop.addEventListener("click", function () {
  window.scrollTo({ top: 0 });
});