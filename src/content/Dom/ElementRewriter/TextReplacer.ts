import {ElementRewriter} from "./ElementRewriter";
import {ElementRewriterType} from "../../../lib/ElementRewriterType";

export class TextReplacer extends ElementRewriter<ElementRewriterType.TextReplacer> {

    private static RANDOM_REPLACEMENT_IDX_KEY = 'ibsubstidx';
    private static TOKEN_SEPARATOR = '*';

    readonly type = ElementRewriterType.TextReplacer;

    private normalizedSearchTexts: Array<{length: number, tokens: string[]}> | undefined;
    private normalizedSearchTextsMinLen: number = 0;
    private replacementHtml: string | undefined;
    private substitutions: Record<string, string>[] | undefined = undefined;

    configure(searchTexts: string[], replacementHtml: string, substitutions: Record<string, string>[]) {
        this.normalizedSearchTexts = searchTexts.map(s => {
            let length = 0;
            const tokens = s.split(TextReplacer.TOKEN_SEPARATOR).map(s => s.trim()).filter(s => s.length).map(token => {
                const normalizedToken = TextReplacer.normalizeText(token);
                length += normalizedToken.length + 1;
                return normalizedToken;
            });
            return {length, tokens};
        }).filter(s => s.tokens.length);
        this.normalizedSearchTextsMinLen = Math.min(...this.normalizedSearchTexts.map(t => t.length));
        this.replacementHtml = replacementHtml;
        this.substitutions = substitutions;
    }

    private isReady(): boolean {
        return this.normalizedSearchTexts !== undefined && this.replacementHtml !== undefined;
    }

    rewrite(element: Element): Element | undefined {
        if (!this.isReady()) {
            console.error('Cannot rewrite: replacements were not configured');
            return;
        }

        const textNode = this.findReplacementTextNode(element);
        const replacementHtml = this.generateReplacementHtml(element);

        if (textNode?.parentNode) {
            const replacement = document.createElement('span');
            textNode.parentNode.insertBefore(replacement, textNode);
            textNode.parentNode.removeChild(textNode);
            replacement.outerHTML = replacementHtml!;
            return replacement;
        } else {
            const marker = document.createElement('span');
            marker.setAttribute('hidden', 'hidden');
            marker.style.visibility = 'none';
            element.innerHTML = replacementHtml!;
            element.appendChild(marker);
            return marker;
        }
    }

    private generateReplacementHtml(element: Element): string {
        if (!this.substitutions) {
            return this.replacementHtml!;
        }
        let randomIndex: number = -1;
        if (element instanceof HTMLElement) {
            const idx = element.dataset[TextReplacer.RANDOM_REPLACEMENT_IDX_KEY];
            if (idx !== undefined) {
                randomIndex = parseInt(idx, 10);
            }
        }
        const isValidIndex = (randomIndex >= 0 && randomIndex < this.substitutions.length);
        if (!isValidIndex) {
            randomIndex = Math.floor(Math.random() * this.substitutions.length);
        }
        const substitition = this.substitutions[randomIndex];
        if (element instanceof HTMLElement) {
            element.dataset[TextReplacer.RANDOM_REPLACEMENT_IDX_KEY] = `${randomIndex}`;
        }
        return this.replacementHtml!.replace(/\${([\w\d_]+)}/ig, (match, key) => substitition[key] ?? match);
    }

    private findReplacementTextNode(root: Element): Text | undefined {
        const queue: Element[] = [];
        queue.push(root);
        let element: Element | undefined;
        while (undefined !== (element = queue.shift())) {
            for (const child of element.childNodes) {
                switch (child.nodeType) {
                    case Node.TEXT_NODE:
                        if (this.textNodeContainsSearchText(child as Text)) {
                            return child as Text;
                        }
                        break;
                    case Node.ELEMENT_NODE:
                        queue.push(child as Element);
                        break;
                }
            }
        }
    }

    private textNodeContainsSearchText(textNode: Text): boolean {
        const textContent = textNode.textContent;

        if (!textContent || textContent.length < this.normalizedSearchTextsMinLen) {
            return false;
        }

        const normalizedNodeText = TextReplacer.normalizeText(textContent);

        for (const variant of this.normalizedSearchTexts!) {
            if (normalizedNodeText.length < variant.length) {
                break;
            }
            let s = normalizedNodeText;
            let foundCounter = 0;
            let pos = 0;
            for (const token of variant.tokens) {
                if (pos > 0) {
                    s = s.substr(pos);
                }
                if (s.length < token.length) {
                    break;
                }
                const idx = s.indexOf(token);
                if (!~idx) {
                    break;
                }
                foundCounter++;
                pos = idx + token.length;
            }
            if (foundCounter == variant.tokens.length) {
                return true;
            }
        }

        return false;
    }

    private static normalizeText(text: string) {
        return text.toLowerCase().replace(/[^\p{L}]/gu, '');
    }

}
