const house = document.querySelector("#house");
const enter = document.querySelector("#enter");

if (house && enter) {
  enter.addEventListener("click", (e) => {
    e.preventDefault();
    house.src = "./assets/images/in.png";
    document.body.classList.add("is-inside");
  });
}

