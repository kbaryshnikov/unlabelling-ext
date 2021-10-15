import {ElementProcessor} from "./ElementProcessor";
import {SelectorConfiguration} from "../../lib/SelectorConfiguration";
import {ElementRewriterType} from "../../lib/ElementRewriterType";

export class DomWatcher {

    private static readonly IGNORE_TAGS = new Set(['br', 'nobr', 'head', 'link', 'meta', 'script', 'style']);

    private mutationObserver: MutationObserver | undefined;
    private selectors: SelectorConfiguration[] | undefined;
    private readonly addedNodes: Set<Element> = new Set();
    private readonly processedNodes: Set<Element> = new Set();

    constructor(private readonly elementProcessor: ElementProcessor) {
    }

    updateSelectors(selectors: SelectorConfiguration[] | undefined) {
        this.selectors = selectors?.length ? selectors : undefined;
        console.log('updateSelectors', this.selectors);
        if (this.selectors) {
            if (!this.mutationObserver) {
                this.scanNodes([document.documentElement]);
                this.start();
            }
        } else {
            this.stop();
        }
    }

    private start() {
        if (this.mutationObserver) {
            return;
        }
        console.log('start');
        this.addedNodes.clear();
        this.processedNodes.clear();
        this.mutationObserver = new MutationObserver(this.observe.bind(this));
        this.mutationObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }

    private stop() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        this.mutationObserver = undefined;
        this.addedNodes.clear();
        this.processedNodes.clear();
        console.log('stop');
    }

    private observe(mutations: MutationRecord[]) {
        let hasAddedNodes = false;
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && !this.processedNodes.has(node as Element)) {
                    this.addedNodes.add(node as Element);
                    hasAddedNodes = true;
                }
            }
            for (const node of mutation.removedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    this.processedNodes.delete(node as Element);
                }
            }
        }

        if (!hasAddedNodes) {
            return;
        }

        this.processAddedNodes();
    }

    private processAddedNodes() {
        if (!this.addedNodes.size) {
            return;
        }

        const nodes = Array.from(this.addedNodes);
        this.addedNodes.clear();

        this.scanNodes(nodes);
    }

    private scanNodes(nodes: Element[]) {
        const nodesToProcess: Map<Element, SelectorConfiguration> = new Map();
        nodes.forEach(node => this.scan(node, nodesToProcess));

        for (const [node, selectorConfig] of nodesToProcess.entries()) {
            this.processNode(node, selectorConfig);
        }
    }

    private processNode(node: Element, selectorConfig: SelectorConfiguration) {
        this.processedNodes.add(node);
        this.applyStyleTweaks(selectorConfig);
        const marker = this.elementProcessor.process(node, selectorConfig.rewriterType);
        marker && this.observeProcessedNode(node, marker);
    }

    private applyStyleTweaks(selectorConfig: SelectorConfiguration) {
        selectorConfig.styleTweaks?.forEach(tweak => {
            const elements = document.documentElement.querySelectorAll(tweak.selector);
            elements.forEach(element => element instanceof HTMLElement && Object.assign(element.style, tweak.styles));
        });
    }

    private observeProcessedNode(node: Element, marker: Element) {
        const observer = new MutationObserver(mutations => {
            console.log(mutations);
            if (node.parentNode?.contains(node) && !node.contains(marker)) {
                observer.disconnect();
                this.addedNodes.add(node);
                console.log("reprocess");
                this.processAddedNodes();
            }
        });
        observer.observe(node, {
            characterData: true,
            childList: true,
            subtree: true,
        });
    }

    private scan(node: Node, nodesToProcess: Map<Element, SelectorConfiguration>) {
        if (!this.selectors) {
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        const element = <Element>node;
        if (DomWatcher.IGNORE_TAGS.has(element.localName)) {
            return;
        }
        const addNodeToProcess = (element: Element, selectorConfig: SelectorConfiguration) => {
            nodesToProcess.has(element) || nodesToProcess.set(element, selectorConfig);
        };
        for (const selectorConfig of this.selectors) {
            if (element.matches(selectorConfig.selector)) {
                addNodeToProcess(element, selectorConfig);
            } else {
                const matches = element.querySelectorAll(selectorConfig.selector);
                if (matches) {
                    for (const match of matches) {
                        addNodeToProcess(match, selectorConfig);
                    }
                }
            }
        }
    }

}
