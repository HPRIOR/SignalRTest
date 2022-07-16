import * as signalR from "@microsoft/signalr";
import { HubConnection } from "@microsoft/signalr";


const divMessages: HTMLDivElement | null = document.querySelector("#divMessages");
const tbMessage: HTMLInputElement | null = document.querySelector("#tbMessage");
const btnSend: HTMLButtonElement | null = document.querySelector("#btnSend");
const btnConnectAdmin: HTMLButtonElement | null = document.querySelector("#btnConnAdmin");
const btnContAdmin: HTMLButtonElement | null = document.querySelector("#btnContAdmin");
const btnDebug: HTMLButtonElement | null = document.querySelector("#debug");
const btnInput: HTMLButtonElement | null = document.querySelector("#inputBtn")
const textInput:HTMLInputElement | null = document.querySelector("#msgInpText")


type Context = "Admin" | "Player";


let connection: HubConnection;

function writeToNodeWithId(id: string, message: string) {
    const node: HTMLElement | null = document.querySelector(id);
    if (node) {
        node.innerHTML = message;
    }else{
        console.log(`Could not find node ${id}`)
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



function writeGreetMsg(context: Context) {
    switch (context) {
        case "Admin":
            writeToNodeWithId("#adminMsg", "Connected as Admin")
            break;
        case "Player":
            writeToNodeWithId("#adminMsg", "Connected as Player")
            break;
    }
}


async function connectToSession(restoreSession: boolean) {
    const params = getUrlParams();
    const player = params["player"];
    const session = params["session"];

    if (!restoreSession) {
        deleteCookie("AdminId")
    }

    const hubUrl = player && session ? `?player=${player}&session=${session}`: "";
    let url = "https://localhost:5001/hub" + hubUrl;

    connection = new signalR.HubConnectionBuilder()
        .withUrl(url)
        .build();

    setupConnectionCallBacks(connection);

    try {
        await connection.start();
    } catch (_) {
        writeToNodeWithId("#adminMsg", "Could not connect");
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
        const m = document.createElement("div");

        const links =
            players.map(player => `<div class="message-author">${player.country}</div><div>${player.url}<div>`);

        m.innerHTML = links.reduce((a, b) => `${a}\n${b}`, "");
        divMessages?.appendChild(m);
    });

    connection.on("couldNotConnect", (reason: string) => {
        writeToNodeWithId( "#adminMsg", `Could not connect: ${reason}`);
    })

    connection.on("verifiedSession", (type: Context) => {
        writeGreetMsg(type);
    })

    connection.on("sendMessage", message => {
        writeToNodeWithId("#msgDiv", message)
    })
}


tbMessage?.addEventListener("keyup", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
        createPlayers();
    }
});

btnSend?.addEventListener("click", createPlayers);
btnDebug?.addEventListener("click", () => connection.send("debug"))
btnConnectAdmin?.addEventListener("click", () => connectToSession(false));
btnContAdmin?.addEventListener("click", () => connectToSession(true));
btnInput?.addEventListener("click", () => {
    connection.send("sendMessageToAdmin", getCookie("SessionId"),textInput?.value);
})

function createPlayers() {
    const countries: string[] = tbMessage!.value.split(",")

    const sessionId = getCookie("SessionId")
    const adminId = getCookie("AdminId")

    connection.send("addPlayers", countries, sessionId, adminId)
        .then(() => (tbMessage ? tbMessage.value = "" : null));
}

