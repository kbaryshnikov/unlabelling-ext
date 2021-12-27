import {Component} from "./Component";
import {Inject} from "../Inject";
import './Root.less';
import html from './Root.html';
import {Messenger} from "../Messenger";
import {RequestType} from "../../lib/Request/RequestType";
import {StatsRequestPayload} from "../../lib/Request/StatsRequest";
import {StatsResponsePayload} from "../../lib/Request/StatsResponse";

@Inject('messenger')
export class Root extends Component<'Root'> {

    static readonly type = 'Root';
    readonly name = Root.type;
    protected html = html;

    constructor(node: HTMLElement, private messenger: Messenger) {
        super(node);
    }

    init() {
        super.init();
        this.messenger.query<RequestType.Stats, StatsRequestPayload, StatsResponsePayload>({
            requestType: RequestType.Stats,
            payload: undefined
        }).then(response => {
            console.log(response);
        });
    }

}
