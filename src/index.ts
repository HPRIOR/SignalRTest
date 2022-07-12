import * as signalR from "@microsoft/signalr";
import { HubConnection } from "@microsoft/signalr";


const divMessages: HTMLDivElement | null = document.querySelector("#divMessages");
const tbMessage: HTMLInputElement | null = document.querySelector("#tbMessage");
const btnSend: HTMLButtonElement | null = document.querySelector("#btnSend");
const btnConnect: HTMLButtonElement | null = document.querySelector("#btnConn");
const btnCont: HTMLButtonElement | null = document.querySelector("#btnCont");
const btnDebug: HTMLButtonElement | null = document.querySelector("#debug");
const playerDiv: HTMLElement | null = document.querySelector("#playerDiv")

let context: "Admin" | "User" = "Admin";


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



function writeGreetMsg(context: "User" | "Admin") {
    if (context == "User") {
        writeToNodeWithId("#adminMsg", `Connected as user`);
        return;
    }

    const adminId = getCookie("AdminId")
    writeToNodeWithId("#adminMsg", `Connected as admin: ${adminId}`)
}


async function connectAsAdmin(restoreSession: boolean) {
    if (!restoreSession) {
        deleteCookie("AdminId")
    }

    connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:5001/hub")
        .build();

    setupConnectionCallBacks(connection)

    try {
        await connection.start();
        const params = getUrlParams();
        connection.send("verifyPlayerSession", params["session"], params["player"])
    } catch (_) {
        writeToNodeWithId("#adminMsg", "Could not connect")
    }

}

async function connectAsPlayer(restoreSession: boolean){
    if (!restoreSession){

    }
}

type Player = {
    url: string,
    sessionId: string,
    country: string,
    playerId: string
}

function setupConnectionCallBacks(connection: signalR.HubConnection) {
    // called by server when players are added 
    connection.on("playersAdded", (players: Array<Player>) => {
        console.log(players)
        const m = document.createElement("div");

        const links =
            players.map(player => `<div class="message-author">${player.country}</div><div>${player.url}<div>`);

        m.innerHTML = links.reduce((a, b) => `${a}\n${b}`, "");
        divMessages?.appendChild(m);
    });

    connection.on("verifiedPlayerSession", (isPlayer: boolean) => {
        if (isPlayer) {
            context = "User"
        }
        else {
            context = "Admin"
        }
        writeGreetMsg(context);
    });
}


tbMessage?.addEventListener("keyup", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
        createPlayers();
    }
});

btnSend?.addEventListener("click", createPlayers);
btnConnect?.addEventListener("click", () => connectAsAdmin(false));
btnCont?.addEventListener("click", () => connectAsAdmin(true));
btnDebug?.addEventListener("click", () => connection.send("debug"))

function createPlayers() {
    console.log("hello");
    const countries: string[] = tbMessage!.value.split(",")

    const sessionId = getCookie("SessionId")
    const adminId = getCookie("AdminId")

    connection.send("addPlayers", countries, sessionId, adminId)
        .then(() => (tbMessage ? tbMessage.value = "" : null));
}

