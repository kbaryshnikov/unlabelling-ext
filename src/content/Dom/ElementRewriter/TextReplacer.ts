import {ElementRewriter} from "./ElementRewriter";
import {ElementRewriterType} from "../../../lib/ElementRewriterType";

export class TextReplacer extends ElementRewriter<ElementRewriterType.TextReplacer> {

    readonly type = ElementRewriterType.TextReplacer;

    private normalizedSearchText: string | undefined;
    private replacementHtml: string | undefined;

    configure(searchText: string, replacementHtml: string) {
        this.normalizedSearchText = TextReplacer.normalizeText(searchText);
        this.replacementHtml = replacementHtml;
    }

    private isReady(): boolean {
        return this.normalizedSearchText !== undefined && this.replacementHtml !== undefined;
    }

    rewrite(element: Element): Element | undefined {
        if (!this.isReady()) {
            console.error('Cannot rewrite: replacements were not configured');
            return;
        }

        const textNode = this.findReplacementTextNode(element);

        if (textNode?.parentNode) {
            const replacement = document.createElement('span');
            textNode.parentNode.insertBefore(replacement, textNode);
            textNode.parentNode.removeChild(textNode);
            replacement.outerHTML = this.replacementHtml!;
            console.log('replace1', replacement.outerHTML);
            return replacement;
        } else {
            const marker = document.createElement('span');
            marker.setAttribute('hidden', 'hidden');
            marker.style.visibility = 'none';
            element.innerHTML = this.replacementHtml!;
            element.appendChild(marker);
            console.log('replace2', element.innerHTML);
            return marker;
        }
    }

    private findReplacementTextNode(root: Element): Text | undefined {
        const queue: Element[] = [];
        queue.push(root);
        let element: Element | undefined;
        while (undefined !== (element = queue.shift())) {
            for (const child of element.childNodes) {
                switch (child.nodeType) {
                    case Node.TEXT_NODE:
                        console.log(child.textContent);
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

        if (!textContent || textContent.length < this.normalizedSearchText!.length) {
            return false;
        }

        const normalizedNodeText = TextReplacer.normalizeText(textContent);

        return normalizedNodeText.length >= this.normalizedSearchText!.length
            && normalizedNodeText.includes(this.normalizedSearchText!);
    }

    private static normalizeText(text: string) {
        return text.toLowerCase().replace(/[^\p{L}]/gu, '');
    }

}
