import ApiCommand from "../../utils/ApiCommand";
import { Domain } from "../../utils/Types";
import { logger, spinner } from "../../utils/Utils";
import { command, metadata, option, Options } from "clime";
import { ColorRenderedStyledTable, border, single, color } from "styled-cli-table";

const sortOptions = ["domein", "registrant", "admin", "tech", "verloopdatum", "status"];
const orderOptions = ["asc", "ascending", "desc", "descending"];

const orderMap = {
    "asc": "0",
    "ascending": "0",
    "desc": "1",
    "descending": "1"
};

class CmdOptions extends Options {
    @option({
        name: "tld",
        flag: "t",
        description: "Filter for a specific tld",
        required: false
    })
    tld?: string;

    @option({
        name: "sort",
        flag: "s",
        description: "Sort the list. Valid options are domein, registrant, admin, tech, verloopdatum or status",
        required: false
    })
    sort?: "domein" | "registrant" | "admin" | "tech" | "verloopdatum" | "status";

    @option({
        name: "order",
        flag: "o",
        description: "Specify in which order it should be shown (asc or desc)",
        required: false
    })
    order?: "asc" | "ascending" | "desc" | "descending";

    @option({
        name: "begin",
        flag: "b",
        description: "Show domain names starting with a letter of the alphabet, values: a-z or 0-9",
        required: false
    })
    begin?: string;

    @option({
        name: "quiet",
        flag: "q",
        description: "Disables the loading indicator",
        required: false,
        toggle: true,
        default: false
    })
    quiet!: boolean;
}

@command({
    description: "List all domains"
})
export default class extends ApiCommand {
    @metadata
    async execute(options: CmdOptions): Promise<void> {
        if (!options.quiet) spinner.start();

        this.api.newRequest(options.quiet);

        this.api.addParam("command", "domain_list");

        if (options.tld) this.api.addParam("tld", options.tld);

        if (options.begin) {
            if (/^[a-z0-9]{1}$/ui.test(options.begin)) {
                spinner.stop();
                logger.error("Invalid begin option, the value of begin can only be one letter or number");
                process.exit(1);
            }
            this.api.addParam("begin", options.begin);
        }

        if (options.sort) {
            if (!sortOptions.includes(options.sort)) {
                spinner.stop();
                logger.error("Invalid sort option, valid options are domein, registrant, admin, tech, verloopdatum or status");
                process.exit(1);
            }
            this.api.addParam("sort", options.sort);
        }

        if (options.order) {
            if (!orderOptions.includes(options.order)) {
                spinner.stop();
                logger.error("Invalid order option, valid options are asc, ascending, desc or descending");
                process.exit(1);
            }
            this.api.addParam("order", orderMap[options.order]);
        }

        const domains: Domain[] = [];
        const response = await this.api.send();

        let domainCount = 0;
        try {
            domainCount = parseInt(response.domeincount);
        } catch (e) { }

        for (let i = 0; i < domainCount; i++) {
            domains.push({
                index: String(i + 1),
                domain: response[`domein[${i}]`],
                registrant: response[`registrant[${i}]`],
                registrant_id: response[`registrant_id[${i}]`],
                admin: response[`admin[${i}]`],
                admin_id: response[`admin_id[${i}]`],
                tech: response[`tech[${i}]`],
                tech_id: response[`tech_id[${i}]`],
                bill: response[`bill[${i}]`],
                bill_id: response[`bill_id[${i}]`],
                ns_id: response[`ns_id[${i}]`],
                dns_template: response[`dns_template[${i}]`],
                verloopdatum: response[`verloopdatum[${i}]`],
                inaccountdatum: response[`inaccountdatum[${i}]`],
                status: response[`status[${i}]`],
                autorenew: response[`autorenew[${i}]`]
            });
        }

        const data = [
            ["#", "domain", "registrant"]
        ];

        for (const item of domains) {
            data.push([item.index, item.domain, item.registrant]);
        }

        const table = new ColorRenderedStyledTable(data, {
            ...border(true),
            borderCharacters: single,
            paddingLeft: 1,
            paddingRight: 1,
            backgroundColor: color.brightWhite,
            rows: {
                0: {
                    align: "center",
                    color: color.brightCyan + color.bold
                }
            },
            columns: {
                0: {
                    align: "center",
                    color: color.brightCyan + color.bold
                },
                1: {
                    width: 40
                },
                [-1]: {
                    width: 30
                }
            }
        });

        console.log(table.toString());
    }
}
