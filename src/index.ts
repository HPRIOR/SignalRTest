import * as signalR from "@microsoft/signalr";
import { HubConnection } from "@microsoft/signalr";


const divMessages: HTMLDivElement | null = document.querySelector("#divMessages");
const tbMessage: HTMLInputElement | null = document.querySelector("#tbMessage");
const btnSend: HTMLButtonElement | null = document.querySelector("#btnSend");
const btnConnect: HTMLButtonElement | null = document.querySelector("#btnConn");
const btnCont: HTMLButtonElement | null = document.querySelector("#btnCont");


const username = new Date().getTime();
let connection: HubConnection;

function writeToNodeWithId(id: string, message: string) {
    const node: HTMLElement | null = document.querySelector(id);
    if (node) {
        node.innerHTML = message;
    }
}

function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts?.pop()?.split(';').shift();
}

function deleteCookie(name: string): void {
    document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

function getUrlParams(): { [key: string]: string } {
    const params = window.location.search.substring(1).split("&")
    return Object.assign({}, ...params.map(x => {
        const tup = x.split("=")
        return ({ [tup[0]]: tup[1] })
    }));
}

function writeAdminMsg() {
    const params = getUrlParams()
    const user = params["user"]

    if (user) {
        writeToNodeWithId("#adminMsg", `Connected as user: ${user}`)
        return;
    }

    const adminId = getCookie("AdminId")
    writeToNodeWithId("#adminMsg", `Connected as admin: ${adminId}`)
}

async function connectToHub(restoreSession: boolean) {
    if (!restoreSession) {
        deleteCookie("AdminId")
    }

    connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:5001/hub")
        .build();

    // setup callbacks for connections
    connection.on("messageReceived", (username: string, message: string) => {
        const m = document.createElement("div");

        m.innerHTML = `<div class="message-author">${username}</div><div>${message}<div>`;

        divMessages?.appendChild(m);
    });


    try {
        await connection.start();
        writeAdminMsg();
    } catch (_) {
        writeToNodeWithId("#adminMsg", "Could not connect")
    }

}


tbMessage?.addEventListener("keyup", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
        send();
    }
});

btnSend?.addEventListener("click", send);
btnConnect?.addEventListener("click", () => connectToHub(false));
btnCont?.addEventListener("click", () => connectToHub(true));

function send() {
    connection.send("newMessage", username, tbMessage?.value)
        .then(() => (tbMessage ? tbMessage.value = "" : null));


}

