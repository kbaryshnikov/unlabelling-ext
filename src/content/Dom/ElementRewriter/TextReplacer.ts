import {ElementRewriter} from "./ElementRewriter";
import {ElementRewriterType} from "../../../lib/ElementRewriterType";

export class TextReplacer extends ElementRewriter<ElementRewriterType.TextReplacer> {

    readonly type = ElementRewriterType.TextReplacer;

    private normalizedSearchTexts: string[] | undefined;
    private normalizedSearchTextsMinLen: number = 0;
    private replacementHtml: string | undefined;
    private substitutions: Record<string, string>[] | undefined = undefined;

    configure(searchTexts: string[], replacementHtml: string, substitutions: Record<string, string>[]) {
        this.normalizedSearchTexts = searchTexts.map(searchText => TextReplacer.normalizeText(searchText));
        this.normalizedSearchTextsMinLen = Math.min(...this.normalizedSearchTexts.map(s => s.length));
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
        const replacementHtml = this.generateReplacementHtml();

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

    private generateReplacementHtml(): string {
        if (!this.substitutions) {
            return this.replacementHtml!;
        }
        const randomIndex = Math.floor(Math.random() * this.substitutions.length);
        const substitition = this.substitutions[randomIndex];
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

        for (let nst of this.normalizedSearchTexts!) {
            if (normalizedNodeText.length >= nst.length && normalizedNodeText.includes(nst)) {
                return true;
            }
        }

        return false;
    }

    private static normalizeText(text: string) {
        return text.toLowerCase().replace(/[^\p{L}]/gu, '');
    }

}
