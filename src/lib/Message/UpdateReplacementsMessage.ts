import {Message} from "./Message";
import {MessageType} from "./MessageType";

export interface UpdateReplacementsMessagePayload {
    searchText: string;
    replaceHtml: string;
}

export interface UpdateReplacementsMessage extends Message<MessageType.UpdateReplacements, UpdateReplacementsMessagePayload> {
}