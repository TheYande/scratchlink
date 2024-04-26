import { User } from "./user.js";

export class Session {
    /**
     * Represents a Scratch log in / session. Stores authentication data (session id and xtoken).
     * 
     * @param {string} session_id The session id associated with the login
     * @param {string} [username=null] The username associated with the login
     */
    constructor(session_id, username = null) {
        this.session_id = session_id.toString();
        this._username = username;
        this._headers = {
           
        }
        this._cookies = {
            "scratchsessionsid": this.session_id,
            "scratchcsrftoken": "a",
            "scratchlanguage": "en",
            "accept": "application/json",
            "Content-Type": "application/json"
        };
        this._getXtoken();
        try {
            delete this._headers.Cookie;
        } catch (error) { }
    }
    async _getCsrftoken() {
        try {
            const response = await fetch("https://scratch.mit.edu/csrf_token/", {
                method: "GET"
            });
            const headers = response.headers;
            const setCookieHeader = headers.get("Set-Cookie");
            const csrftoken = setCookieHeader.split("scratchcsrftoken=")[1].split(";")[0];
            this._headers["x-csrftoken"] = csrftoken;
            this._cookies["scratchcsrftoken"] = csrftoken;
        } catch (error) {
            // Handle error
        }
    }

    async _getXtoken() {
        try {
            const response = await fetch("https://scratch.mit.edu/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36",
                    "x-csrftoken": `a`,
                    "x-requested-with": "XMLHttpRequest",
                    "referer": "https://scratch.mit.edu",
                    "Cookie":
                        ` scratchcsrftoken=a; scratchsessionsid="${this.session_id}"`
                },
                body: new URLSearchParams({
                    "scratchsessionsid": this.session_id,
                    "scratchcsrftoken": `a`,
                    "scratchlanguage": "en"
                })
            });
            const responseData = await response.json();
          
            this.xtoken = responseData?.user.token;
            this._headers["X-Token"] = this.xtoken;
            this.email = responseData.user.email;
            this.newScratcher = responseData.permissions.new_scratcher;
            this.muteStatus = responseData.permissions.mute_status;
            this._username = responseData.user.username;
            this.banned = responseData.user.banned;
            if (this.banned) {
                console.warn(`Warning: The account ${this._username} you logged in to is BANNED. Some features may not work properly.`);
            }
        } catch (error) {
            console.warn(error)
            if (this._username === null) {
                console.log("Warning: Logged in, but couldn't fetch XToken.\nSome features (including cloud variables) will not work properly. To get cloud variables to work, provide a username argument: new Session('session_id', { username: 'username' })\nIf you're using an online IDE (like replit.com) Scratch possibly banned its IP address.");
            } else {
                console.log(`Warning: Logged in as ${this._username}, but couldn't fetch XToken. Cloud variables will still work, but other features may not work properly.\nIf you're using an online IDE (like replit.com) Scratch possibly banned its IP address.`);
            }
            this.xtoken = "";
        }
    }
    getLinkedUser() {
        if (!("_user" in this)) {
            this._user = this.connectUser(this._username);
        }
        return this._user;
    }
    async myStuffProjects(ordering, { page = 1, sortBy = "", descending = true } = {}) {
        let ascsort = "";
        let descsort = "";
        if (descending) {
            descsort = sortBy;
        } else {
            ascsort = sortBy;
        }
        try {
            const response = await fetch(`https://scratch.mit.edu/site-api/projects/${ordering}/?page=${page}&ascsort=${ascsort}&descsort=${descsort}`, {
                headers: headers,
                credentials: "include"
            });
            const targets = await response.json();
            const projects = targets.map(target => ({
                author: this._username,
                created: target.fields.datetime_created,
                lastModified: target.fields.datetime_modified,
                shareDate: target.fields.datetime_shared,
                shared: target.fields.isPublished,
                id: target.pk,
                thumbnailUrl: "https://uploads.scratch.mit.edu" + target.fields.uncached_thumbnail_url.substring(1),
                favorites: target.fields.favorite_count,
                loves: target.fields.love_count,
                remixes: target.fields.remixers_count,
                views: target.fields.view_count,
                thumbnailName: target.fields.thumbnail,
                title: target.fields.title,
                url: "https://scratch.mit.edu/projects/" + target.pk,
                commentCount: target.fields.commenters_count
            }));
            return projects;
        } catch (error) {
            throw new Error("FetchError");
        }
    }
    async messages({ limit = 40, offset = 0 } = {}) {
        try {
            const response = await fetch(`https://api.scratch.mit.edu/users/${this._username}/messages?limit=${limit}&offset=${offset}`, {
                headers: this._headers,
                credentials: "include"
            });
            return await response.json();
        } catch (error) {
            throw new Error("FetchError");
        }
    }
    async clearMessages() {
        try {
            const response = await fetch("https://scratch.mit.edu/site-api/messages/messages-clear/", {
                method: "POST",
                headers: this._headers,
                credentials: "include"
            });
            return await response.text();
        } catch (error) {
            throw new Error("FetchError");
        }
    }

    async messageCount() {
        try {
            const response = await fetch(`https://api.scratch.mit.edu/users/${this._username}/messages/count/`, {
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.3c6 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
                }
            });
            const data = await response.json();
            return data.count;
        } catch (error) {
            throw new Error("FetchError");
        }
    }
    async getFeed({ limit = 20, offset = 0 } = {}) {
        try {
            const response = await fetch(`https://api.scratch.mit.edu/users/${this._username}/following/users/activity?limit=${limit}&offset=${offset}`, {
                headers: this._headers,
                credentials: "include"
            });
            return await response.json();
        } catch (error) {
            throw new Error("FetchError");
        }
    }
    async lovedByFollowedUsers({ limit = 40, offset = 0 } = {}) {
        try {
            const response = await fetch(`https://api.scratch.mit.edu/users/${this._username}/following/users/loves?limit=${limit}&offset=${offset}`, {
                headers: this._headers,
                credentials: "include"
            });
            const data = await response.json();
            const projects = data.map(project_dict => {
                const p = new Project({ _session: this });
                p._updateFromDict(project_dict);
                return p;
            });
            return projects;
        } catch (error) {
            throw new Error("FetchError");
        }
    }
    async searchProjects({ query = "", mode = "trending", language = "en", limit = 40, offset = 0 } = {}) {
        try {
            const response = await fetch(`https://api.scratch.mit.edu/search/projects?limit=${limit}&offset=${offset}&language=${language}&mode=${mode}&q=${query}`);
            const data = await response.json();
            const projects = data.map(project_dict => {
                const p = new Project({ _session: this });
                p._updateFromDict(project_dict);
                return p;
            });
            return projects;
        } catch (error) {
            throw new Error("FetchError");
        }
    }
    async exploreProjects({ query = "*", mode = "trending", language = "en", limit = 40, offset = 0 } = {}) {
        try {
            const response = await fetch(`https://api.scratch.mit.edu/explore/projects?limit=${limit}&offset=${offset}&language=${language}&mode=${mode}&q=${query}`);
            const data = await response.json();
            const projects = data.map(project_dict => {
                const p = new Project({ _session: this });
                p._updateFromDict(project_dict);
                return p;
            });
            return projects;
        } catch (error) {
            throw new Error("FetchError");
        }
    }
    async backpack({ limit = 20, offset = 0 } = {}) {
        try {
            const response = await fetch(`https://backpack.scratch.mit.edu/${this._username}?limit=${limit}&offset=${offset}`, {
                headers: this._headers
            });
            return await response.json();
        } catch (error) {
            throw new Error("FetchError");
        }
    }
    connectCloud(project_idArg, { projectId = null } = {}) {
        const project_id = projectId !== null ? projectId : project_idArg;
        if (project_id === null) {
            return null;
        }

        return new CloudConnection({ username: this._username, sessionId: this.session_id, projectId: parseInt(project_id) });
    }
    connectTwCloud(project_idArg, { projectId = null, purpose = "", contact = "" } = {}) {
        return cloud.connectTwCloud(project_idArg, { projectId, purpose, contact });
    }
    connectUser(username) {
        try {
            const _user = new User({ username, _session: this });
            if (_user.update() === "429") {
                throw new Response429("Your network is blocked or rate-limited by Scratch.\nIf you're using an online IDE like replit.com, try running the code on your computer.");
            }
            return _user;
        } catch (error) {
            throw error;
        }
    }
    connectProject(projectId) {
        try {
            const _project = new Project({ id: parseInt(projectId), _session: this });
            const u = _project.update();
            if (u === "429") {
                throw new Response429("Your network is blocked or rate-limited by Scratch.\nIf you're using an online IDE like replit.com, try running the code on your computer.");
            }
            if (!u) {
                return new PartialProject({ id: parseInt(projectId) });
            }
            return _project;
        } catch (error) {
            throw error;
        }
    }
    connectProject(projectId) {
        try {
            const _project = new Project({ id: parseInt(projectId), _session: this });
            const u = _project.update();
            if (u === "429") {
                throw new Response429("Your network is blocked or rate-limited by Scratch.\nIf you're using an online IDE like replit.com, try running the code on your computer.");
            }
            if (!u) {
                return new PartialProject({ id: parseInt(projectId) });
            }
            return _project;
        } catch (error) {
            throw error;
        }
    }
    connectStudio(studioId) {
        try {
            const _studio = new Studio({ id: parseInt(studioId), _session: this });
            if (_studio.update() === "429") {
                throw new Response429("Your network is blocked or rate-limited by Scratch.\nIf you're using an online IDE like replit.com, try running the code on your computer.");
            }
            return _studio;
        } catch (error) {
            throw error;
        }
    }
    connectTopic(topicId) {
        try {
            const topic = new ForumTopic({ id: parseInt(topicId), _session: this });
            topic.update();
            return topic;
        } catch (error) {
            return null;
        }
    }
    async connectTopicList(categoryName, { page = 0, includeDeleted = false } = {}) {
        try {
            const filter = includeDeleted ? 0 : 1;
            const response = await fetch(`https://scratchdb.lefty.one/v3/forum/category/topics/${encodeURIComponent(categoryName)}/${page}?detail=1&filter=${filter}`);
            const data = await response.json();
            const topics = data.map(topic => {
                const t = new ForumTopic({ id: topic.id, _session: this });
                t._updateFromDict(topic);
                return t;
            });
            return topics;
        } catch (error) {
            return null;
        }
    }
    connectPost(postId) {
        try {
            const post = new ForumPost({ id: parseInt(postId), _session: this });
            post.update();
            return post;
        } catch (error) {
            return null;
        }
    }
    async searchPosts({ query, order = "newest", page = 0 }) {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/forum/search?q=${query}&o=${order}&page=${page}`);
            const data = (await response.json()).posts;
            const posts = data.map(o => {
                const post = new ForumPost({ id: o.id, _session: this._session });
                post._updateFromDict(o);
                return post;
            });
            return posts;
        } catch (error) {
            return [];
        }
    }
    async uploadAsset(asset) {
        const data = asset instanceof Buffer ? asset : await fs.promises.readFile(asset);

        const fileExt = path.extname(asset);

        await fetch(`https://assets.scratch.mit.edu/${crypto.createHash('md5').update(data).digest('hex')}.${fileExt}`, {
            method: "POST",
            headers: this._headers,
            body: data
        });
    }
}
export async function login(username, password) {

    const response = await fetch("https://scratch.mit.edu/accounts/login/", {
        credentials: "include", // this ensures that cookies are sent
        method: "POST",
        headers: {
            "Cookie": "scratchcsrftoken=a; scratchlanguage=en",
            //                         ^ this can be anything, as long as it matches the X-CSRFToken header below
            "Origin": "https://scratch.mit.edu",
            "Referer": "https://scratch.mit.edu/",
            "X-CSRFToken": "a",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "useMessages": true,
            "username": `${username}`,
            "password": `${password}`,
        }),
    });

    const setCookie = response.headers.get("Set-Cookie");
    if (!setCookie) {
        throw new LoginFailure("Either the provided authentication data is wrong or your network is banned from Scratch.\n\nIf you're using an online IDE (like replit.com) Scratch possibly banned its IP address. In this case, try logging in with your session id: https://github.com/TimMcCool/scratchattach/wiki#logging-in");
    }
    // console.log(await response.text())
    const session_id = setCookie.match(/"(.*)"/)[1];
    const session =  new Session(session_id, username)
    await session._getCsrftoken();
    await session._getXtoken();
    return session
}
