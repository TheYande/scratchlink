import { User } from "./user.d.ts"

export class ForumTopic {
    constructor(entries: any, headers: any);
    async update(): void
    updateFromDict(topic: any): void
    async activity(): Promise<{
        change: string,
        previous_value: string,
        time_found: string,
        time_previous_seen: string
    }[]>
    async posts(page: number | undefined, order: string | undefined): Promise<{
        id: number,
        username: string,
        editor: boolean | null,
        deleted: number,
        time: {
            posted: string,
            first_checked: string,
            html_last_checked: string,
            bbcode_last_checked: string,
            edited: boolean | null
        },
        content: {
            html: string,
            bb: string
        },
        parser: {
            version: number,
            highest: number
        },
        topic: {
            id: number,
            title: string,
            category: string,
            closed: number,
            deleted: number,
            time: {
                first_checked: string,
                last_checked: string
            }
        }
    }[]>
    async first_post() :Promise<{
        id: number,
        username: string,
        editor: boolean | null,
        deleted: number,
        time: {
            posted: string,
            first_checked: string,
            html_last_checked: string,
            bbcode_last_checked: string,
            edited: boolean | null
        },
        content: {
            html: string,
            bb: string
        },
        parser: {
            version: number,
            highest: number
        },
        topic: {
            id: number,
            title: string,
            category: string,
            closed: number,
            deleted: number,
            time: {
                first_checked: string,
                last_checked: string
            }
        }
    }>
}

export class ForumPost {
    constructor(entries: any, headers: any);
    update(post:{
        id: number,
        username: string,
        editor: boolean | null,
        deleted: number,
        time: {
            posted: string,
            first_checked: string,
            html_last_checked: string,
            bbcode_last_checked: string,
            edited: boolean | null
        },
        content: {
            html: string,
            bb: string
        },
        parser: {
            version: number,
            highest: number
        },
        topic: {
            id: number,
            title: string,
            category: string,
            closed: number,
            deleted: number,
            time: {
                first_checked: string,
                last_checked: string
            }
        }
    }):void
    async get_topic(): Promise<ForumTopic>
    async get_author(): Promise<User>
    async edit(new_content:any):void
}