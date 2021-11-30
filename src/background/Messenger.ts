import {Message} from "../lib/Message/Message";
import {MessageType} from "../lib/Message/MessageType";
import {TabsListener} from "./TabsListener";
import {Runtime} from "webextension-polyfill";

export class Messenger {

    constructor(private readonly tabsListener: TabsListener) {
    }

    listen() {
        browser.runtime.onConnect.addListener(this.onPortConnected.bind(this));
    }

    private onPortConnected(port: Runtime.Port) {
        const tabId = port.sender?.tab?.id;
        if (!tabId) {
            return;
        }
        this.tabsListener.onPortConnected({
            tabId,
            sendMessage: this.sendMessageToPort.bind(this, port),
        }, port.sender?.tab?.url);
    }

    sendMessageToPort<T extends MessageType, M extends Message<T, any>>(port: Runtime.Port, message: M) {
        port.postMessage(message);
    }

}
