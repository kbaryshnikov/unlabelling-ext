import {Tabs} from "webextension-polyfill";
import {BlockerConfiguration} from "./BlockerConfiguration/BlockerConfiguration";
import {MessageType} from "../lib/Message/MessageType";
import {ContentScriptPort} from "./ContentScriptPort";
import {Message} from "../lib/Message/Message";
import {BatchMessage} from "../lib/Message/BatchMessage";
import {UpdateReplacementsMessage} from "../lib/Message/UpdateReplacementsMessage";

export class TabsListener {

    private isListening = false;

    private tabs: Set<number> = new Set();
    private ports: Map<number, ContentScriptPort> = new Map();
    private initMessages: Map<number, Message<any, any>> = new Map();

    constructor(private readonly blockerConfiguration: BlockerConfiguration) {
    }

    listen() {
        if (this.isListening) {
            throw new Error("Already listening");
        }
        this.setupListener();
        this.isListening = true;
    }

    onPortConnected(port: ContentScriptPort, url: string | undefined) {
        this.ports.set(port.tabId, port);
        const initMessage = this.initMessages.get(port.tabId);
        if (initMessage) {
            this.initMessages.delete(port.tabId);
            port.sendMessage(initMessage);
        } else if (url) {
            this.testTab(port.tabId, url);
        }
    }

    private setupListener() {
        browser.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));
        browser.tabs.onRemoved.addListener(tabId => this.tabs.delete(tabId));
    }

    private onTabUpdated(tabId: number, info: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab) {
        switch (info.status) {
            case 'loading':
                const url = info.url || tab.url;
                url && this.testTab(tabId, url);
                break;
        }
    }

    private testTab(tabId: number, url: string) {
        if (this.findSelectorsAndConfigureContentScript(tabId, url)) {
            this.tabs.add(tabId);
        } else if (this.tabs.has(tabId)) {
            this.shutdownTab(tabId).catch(error => console.error(error));
        }
    }

    private findSelectorsAndConfigureContentScript(tabId: number, url: string): boolean {
        this.initMessages.delete(tabId);

        const domainName = TabsListener.parseDomainName(url);
        if (!domainName) {
            return false;
        }

        const selectors = this.blockerConfiguration.find(domainName);
        if (!selectors) {
            return false;
        }

        const updateReplacementsMessage: UpdateReplacementsMessage = {
            type: MessageType.UpdateReplacements,
            payload: {
                ...this.blockerConfiguration.replacementsConfig,
                substitutions: this.blockerConfiguration.substitutions,
            },
        };
        const updateSelectorsMessage = {
            type: MessageType.UpdateSelectors,
            payload: {selectors},
        };
        const initMessage: BatchMessage = {
            type: MessageType.Batch,
            payload: [
                updateReplacementsMessage,
                updateSelectorsMessage,
            ],
        };

        const port = this.ports.get(tabId);
        if (port) {
            port.sendMessage(initMessage);
        } else {
            this.initMessages.set(tabId, initMessage);
        }

        return true;
    }

    private async shutdownTab(tabId: number): Promise<void> {
        this.initMessages.delete(tabId);
        const port = this.ports.get(tabId);
        if (port) {
            port.sendMessage({
                type: MessageType.UpdateSelectors,
                payload: {selectors: undefined},
            });
        }
    }

    private static parseDomainName(tabUrl: string): string | undefined {
        const url: URL = new URL(tabUrl);
        if (!url.hostname || !['http:', 'https:'].includes(url.protocol)) {
            return undefined;
        }
        return this.normalizeHostname(url.hostname);
    }

    private static normalizeHostname(hostname: string): string {
        return hostname.toLowerCase().replace(/(^www\.|\.$)/g, '');
    }

}
