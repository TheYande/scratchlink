import * as user from "./user.js"

const headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36',
    "x-csrftoken": "a",
    "x-requested-with": "XMLHttpRequest",
    "referer": "https://scratch.mit.edu",
}
async function get(url, headers = undefined) {
    let raw = await fetch(url, headers)
    return await raw.json()
}
export class ForumTopic {
    constructor(entries, headers) {
        for (const key in entries) {
            if (Object.prototype.hasOwnProperty.call(entries, key)) {
                this[key] = entries[key];
            }
        }

        if (!("_session" in this)) {
            this._session = null;
        }

        if (this._session === null) {
            this._headers = headers;
            this._cookies = {};
        } else {
            this._headers = this._session._headers;
            this._cookies = this._session._cookies;
        }

        try {
            delete this._headers.Cookie;
        } catch (error) { }
    }

    async update() {
        const topic = await get(`https://scratchdb.lefty.one/v3/forum/topic/info/${this.id}`)
        return this.updateFromDict(topic)
    }

    updateFromDict(topic) {
        this.title = topic.title
        this.category = topic.category
        this.closed = topic.closed == 1 ? true : false
        this.deleted = topic.deleted == 1 ? true : false
        this.postCount = topic.post_count
    }
    async activity() {
        return await get(`https://scratchdb.lefty.one/v3/forum/topic/history/${this.id}`)
    }

    async posts({ page = 0, order = "oldest" } = {}) {
        try {
            const data = await get(`https://scratchdb.lefty.one/v3/forum/topic/posts/${this.id}/${page}?o=${order}`);

            const return_data = data.map(o => {
                const a = new ForumPost({ id: o.id, _session: this._session });
                a._update_from_dict(o);
                return a;
            });

            return return_data;
        } catch (error) {
            console.error("Error fetching posts:", error);
            return [];
        }
    }

    async first_post() {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/forum/topic/posts/${this.id}/0?o=oldest`);
            const data = await response.json();

            if (data.length > 0) {
                const o = data[0];
                const a = new ForumPost({ id: o.id, _session: this._session });
                a._update_from_dict(o);
                return a;
            } else {
                console.error("No posts found for the topic.");
                return null;
            }
        } catch (error) {
            console.error("Error fetching first post:", error);
            return null;
        }
    }
}

export class ForumPost {
    /**
     * Represents a Scratch forum post.
     * @param {Object} entries - Object containing attributes of the forum post.
     */
    constructor(entries, session) {
        this._session = session;
        this._headers = session ? session._headers : {};
        this._cookies = session ? session._cookies : {};
        this.update(entries);
    }

    /**
     * Updates the attributes of the ForumPost object.
     * @param {Object} post - Object containing updated attributes of the forum post.
     */
    update(post) {
        this.author = post.username;
        this.posted = post.time.posted;
        this.edited = post.time.edited;
        this.edited_by = post.editor;
        this.deleted = post.deleted === 1;
        this.html_content = post.content.html;
        this.bb_content = post.content.bb;
        this.topic_id = post.topic.id;
        this.topic_name = post.topic.title;
        this.topic_category = post.topic.category;
    }

    /**
     * Fetches the topic object representing the forum topic this post is in.
     * @returns {Promise<Object>} - Promise object representing the forum topic.
     */
    async get_topic() {
        const ForumTopic = require('./ForumTopic'); // Assuming ForumTopic class definition is available in ForumTopic.js
        const t = new ForumTopic(this.topic_id, this._session);
        await t.update();
        return t;
    }

    /**
     * Fetches the user object representing the user who created this forum post.
     * @returns {Promise<Object>} - Promise object representing the user.
     */
    async get_author() {
      
        const u = new User({ username: this.author }, this._session);
        await u.update();
        return u;
    }

    /**
     * Edits the content of the forum post.
     * @param {string} new_content - The new content for the forum post.
     */
    async edit(new_content) {
        const response = await fetch(`https://scratch.mit.edu/discuss/post/${this.id}/edit/`, {
            method: 'POST',
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'accept-language': 'de,en;q=0.9',
                'cache-control': 'max-age=0',
                'content-type': 'application/x-www-form-urlencoded',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'Referer': `https://scratch.mit.edu/discuss/post/${this.id}/edit/`,
                'x-csrftoken': 'a' // Replace 'a' with the actual csrf token
            },
            body: `csrfmiddlewaretoken=a&body=${encodeURIComponent(new_content)}&`
        });

        // Handle response as needed
    }
}