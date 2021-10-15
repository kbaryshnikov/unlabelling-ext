import {ElementRewriterType} from "./ElementRewriterType";

export interface SelectorConfiguration {
    selector: string;
    rewriterType?: ElementRewriterType | undefined;
}