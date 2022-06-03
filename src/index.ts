import * as signalR from "@microsoft/signalr";

const divMessages: HTMLDivElement | null = document.querySelector("#divMessages");
const tbMessage: HTMLInputElement | null = document.querySelector("#tbMessage");
const btnSend: HTMLButtonElement | null = document.querySelector("#btnSend");
const username = new Date().getTime();

const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:5001/hub")
    .build();

connection.on("messageReceived", (username: string, message: string) => {
    const m = document.createElement("div");

    m.innerHTML = `<div class="message-author">${username}</div><div>${message}</div>`;

    divMessages?.appendChild(m);
});

connection.start().catch((err) => document.write(err));

tbMessage?.addEventListener("keyup", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
        send();
    }
});

btnSend?.addEventListener("click", send);

function send() {
    connection.send("newMessage", username, tbMessage?.value)
        .then(() => (tbMessage ? tbMessage.value  = "": null));
}