//this one was pain

import { error } from "console";

export class User {
    /**
     * Represents a Scratch user.
     * @param {Object} entries - Object containing attributes of the user.
     */
    constructor(entries, session) {
        this._session = session;
        this._headers = session ? {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "en-US,en;q=0.5",
            "Content-Type": "application/json",
            "X-CSRFToken": `${this._session._headers["x-csrftoken"]}`,
            "X-Requested-With": "XMLHttpRequest",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Cookie":
                ` scratchcsrftoken="${this._session._headers["x-csrftoken"]}"; scratchsessionsid="${this._session.session_id}"`
        } : {};
        this._cookies = session ? session._cookies : {};
        this._json_headers = { ...this._headers, 'accept': 'application/json', 'Content-Type': 'application/json' };
        this.username = entries


    }
    async update() {
        try {
            const response = await fetch(`https://api.scratch.mit.edu/users/${this.username}/`);
            if (response.status === 429) {
                return 429;
            }
            const data = await response.json();
            this.updateFromDict(data);
            this._headers = session ? {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "en-US,en;q=0.5",
                "Content-Type": "application/json",
                "X-CSRFToken": `${this._session._headers["x-csrftoken"]}`,
                "X-Requested-With": "XMLHttpRequest",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Cookie":
                    ` scratchcsrftoken="${this._session._headers["x-csrftoken"]}"; scratchsessionsid="${this._session.session_id}"`
            } : {};
        } catch (error) {
            console.error("Error updating user:", error);
        }
    }
    updateFromDict(response) {
        try {
            this.id = response.id;
        } catch (error) {
            throw new Error("UserNotFound");
        }
        this.username = response.username
        this.scratchteam = response.scratchteam;
        this.joinDate = response.history?.joined;
        this.aboutMe = response.profile.bio;
        this.wiwo = response.profile.status;
        this.country = response.profile.country;
        this.iconUrl = response.profile.images['90x90'];
    }
    parseActivity(htm) {
        const $ = cheerio.load(htm); // Load the HTML string

        const activity = [];
        const source = $('li'); // Select all <li> elements

        source.each((index, element) => {
            const time = $(element).find('div span').eq(2).text().trim().replace(/\xa0/g, ' ');
            const user = $(element).find('div span').eq(0).text().trim();
            const operation = $(element).find('div span').eq(1).text().trim();
            const result = $(element).find('div span').eq(3).text().trim();

            activity.push({ user, operation, result, time });
        });

        return activity;
    }
    async messageCount() {
        try {
            const response = await fetch(`https://api.scratch.mit.edu/users/${this.username}/messages/count/`, {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.3c6 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
                }
            });
            const data = await response.json();
            return data.count;
        } catch (error) {
            console.error("Error fetching message count:", error);
            return 0;
        }
    }
    async featuredData() {
        try {
            const response = await fetch(`https://scratch.mit.edu/site-api/users/all/${this.username}/`);
            const data = await response.json();
            return {
                label: data.featured_project_label_name,
                project: {
                    id: String(data.featured_project_data.id),
                    author: data.featured_project_data.creator,
                    thumbnailUrl: `https://${data.featured_project_data.thumbnail_url.slice(2)}`,
                    title: data.featured_project_data.title
                }
            };
        } catch (error) {
            console.error("Error fetching featured data:", error);
            return null;
        }
    }
    async followerCount() {
        try {
            const response = await fetch(`https://scratch.mit.edu/users/${this.username}/followers/`, {
                headers: {
                    'x-csrftoken': 'a',
                    'x-requested-with': 'XMLHttpRequest',
                    'Cookie': 'scratchcsrftoken=a;scratchlanguage=en;',
                    'referer': 'https://scratch.mit.edu',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
                }
            });
            const text = await response.text();
            const followerCountString = text.split("Followers (")[1].split(")")[0];
            return parseInt(followerCountString);
        } catch (error) {
            console.error("Error fetching follower count:", error);
            return 0;
        }
    }
    async followingCount() {
        try {
            const response = await fetch(`https://scratch.mit.edu/users/${this.username}/following/`, {
                headers: {
                    'x-csrftoken': 'a',
                    'x-requested-with': 'XMLHttpRequest',
                    'Cookie': 'scratchcsrftoken=a;scratchlanguage=en;',
                    'referer': 'https://scratch.mit.edu',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
                }
            });
            const text = await response.text();
            const followingCountString = text.split("Following (")[1].split(")")[0];
            return parseInt(followingCountString);
        } catch (error) {
            console.error("Error fetching following count:", error);
            return 0;
        }
    }
    async followers({ limit = 40, offset = 0 } = {}) {
        try {
            if (limit > 40) {
                limit = 40;
            }
            const response = await fetch(`https://api.scratch.mit.edu/users/${this.username}/followers/?limit=${limit}&offset=${offset}`);
            const followersData = await response.json();
            const followers = [];

            for (const follower of followersData) {
                try {
                    const user = new User({
                        id: follower.id,
                        username: follower.username,
                        scratchteam: follower.scratchteam,
                        joinDate: follower.history.joined,
                        iconUrl: follower.profile.images['90x90'],
                        status: follower.profile.status,
                        bio: follower.profile.bio,
                        country: follower.profile.country
                    });
                    followers.push(user);
                } catch (error) {
                    console.error("Failed to parse follower:", follower);
                }
            }
            return followers;
        } catch (error) {
            console.error("Error fetching followers:", error);
            return [];
        }
    }
    async followerNames({ limit = 40, offset = 0 } = {}) {
        try {
            const followers = await this.followers({ limit, offset });
            return followers.map((follower) => { return follower.username.username });
        } catch (error) {
            console.error("Error fetching follower names:", error);
            return [];
        }
    }
    async following({ limit = 40, offset = 0 } = {}) {
        try {
            if (limit > 40) {
                limit = 40;
            }
            const response = await fetch(`https://api.scratch.mit.edu/users/${this.username}/following/?limit=${limit}&offset=${offset}`);
            const followingData = await response.json();
            const following = [];

            for (const user of followingData) {
                try {
                    const followingUser = new User({
                        id: user.id,
                        username: user.username,
                        scratchteam: user.scratchteam,
                        joinDate: user.history.joined,
                        iconUrl: user.profile.images['90x90'],
                        status: user.profile.status,
                        bio: user.profile.bio,
                        country: user.profile.country
                    });
                    following.push(followingUser);
                } catch (error) {
                    console.error("Failed to parse following user:", user);
                }
            }
            return following;
        } catch (error) {
            console.error("Error fetching following users:", error);
            return [];
        }
    }
    async followingNames({ limit = 40, offset = 0 } = {}) {
        try {
            const following = await this.following({ limit, offset });
            return following.map(user => user.username);
        } catch (error) {
            console.error("Error fetching following user names:", error);
            return [];
        }
    }
    async isFollowing(user) {
        try {
            const response = await fetch(`http://explodingstar.pythonanywhere.com/api/${this.username}/?following=${user}`);
            const data = await response.json();
            return data.following;
        } catch (error) {
            console.error("Error checking if user is following:", error);
            return false;
        }
    }
    async isFollowedBy(user) {
        try {
            const response = await fetch(`http://explodingstar.pythonanywhere.com/api/${user}/?following=${this.username}`);
            const data = await response.json();
            return data.following;
        } catch (error) {
            console.error("Error checking if user is followed by:", error);
            return false;
        }
    }
    async projectCount() {
        try {
            const response = await fetch(`https://scratch.mit.edu/users/${this.username}/projects/`, {
                headers: {
                    'x-csrftoken': 'a',
                    'x-requested-with': 'XMLHttpRequest',
                    'Cookie': 'scratchcsrftoken=a;scratchlanguage=en;',
                    'referer': 'https://scratch.mit.edu',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
                }
            });
            const text = await response.text();
            const projectCountString = text.split("Shared Projects (")[1].split(")")[0];
            return parseInt(projectCountString);
        } catch (error) {
            console.error("Error fetching project count:", error);
            return 0;
        }
    }
    async studioCount() {
        try {
            const response = await fetch(`https://scratch.mit.edu/users/${this.username}/studios/`, {
                headers: {
                    'x-csrftoken': 'a',
                    'x-requested-with': 'XMLHttpRequest',
                    'Cookie': 'scratchcsrftoken=a;scratchlanguage=en;',
                    'referer': 'https://scratch.mit.edu',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
                }
            });
            const text = await response.text();
            const studioCountString = text.split("Studios I Curate (")[1].split(")")[0];
            return parseInt(studioCountString);
        } catch (error) {
            console.error("Error fetching studio count:", error);
            return 0;
        }
    }

    async studiosFollowingCount() {
        try {
            const response = await fetch(`https://scratch.mit.edu/users/${this.username}/studios/`, {
                headers: {
                    'x-csrftoken': 'a',
                    'x-requested-with': 'XMLHttpRequest',
                    'Cookie': 'scratchcsrftoken=a;scratchlanguage=en;',
                    'referer': 'https://scratch.mit.edu',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
                }
            });
            const text = await response.text();
            const studiosFollowingCountString = text.split("Studios I Follow (")[1].split(")")[0];
            return parseInt(studiosFollowingCountString);
        } catch (error) {
            console.error("Error fetching studios following count:", error);
            return 0;
        }
    }

    async studios({ limit = 40, offset = 0 } = {}) {
        try {
            const response = await fetch(`https://api.scratch.mit.edu/users/${this.username}/studios/curate?limit=${limit}&offset=${offset}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching user's curated studios:", error);
            return {};
        }
    }

    async projects({ limit = null, offset = 0 } = {}) {
        try {
            let url = `https://api.scratch.mit.edu/users/${this.username}/projects/`;
            if (limit !== null) {
                url += `?limit=${limit}&offset=${offset}`;
            } else {
                url += `?offset=${offset}`;
            }

            const response = await fetch(url, {
                headers: {
                    'x-csrftoken': 'a',
                    'x-requested-with': 'XMLHttpRequest',
                    'Cookie': 'scratchcsrftoken=a;scratchlanguage=en;',
                    'referer': 'https://scratch.mit.edu',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
                }
            });

            const data = await response.json();
            const projects = data.map(project_dict => ({
                _session: this._session,
                author: this.username,
                commentsAllowed: project_dict.comments_allowed,
                description: project_dict.description,
                created: project_dict.history.created,
                lastModified: project_dict.history.modified,
                shareDate: project_dict.history.shared,
                id: project_dict.id,
                thumbnailUrl: project_dict.image,
                instructions: project_dict.instructions,
                remixParent: project_dict.remix.parent,
                remixRoot: project_dict.remix.root,
                favorites: project_dict.stats.favorites,
                loves: project_dict.stats.loves,
                remixes: project_dict.stats.remixes,
                views: project_dict.stats.views,
                title: project_dict.title,
                url: `https://scratch.mit.edu/projects/${project_dict.id}`
            }));

            return projects;
        } catch (error) {
            console.error("Error fetching user's projects:", error);
            return [];
        }
    }
    async favorites({ limit = null, offset = 0 } = {}) {
        try {
            let url = `https://api.scratch.mit.edu/users/${this.username}/favorites/`;
            if (limit !== null) {
                url += `?limit=${limit}&offset=${offset}`;
            } else {
                url += `?offset=${offset}`;
            }

            const response = await fetch(url, {
                headers: {
                    'x-csrftoken': 'a',
                    'x-requested-with': 'XMLHttpRequest',
                    'Cookie': 'scratchcsrftoken=a;scratchlanguage=en;',
                    'referer': 'https://scratch.mit.edu',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
                }
            });

            const data = await response.json();
            const projects = data.map(project_dict => ({
                _session: this._session,
                author: this.username,
                commentsAllowed: project_dict.comments_allowed,
                description: project_dict.description,
                created: project_dict.history.created,
                lastModified: project_dict.history.modified,
                shareDate: project_dict.history.shared,
                id: project_dict.id,
                thumbnailUrl: project_dict.image,
                instructions: project_dict.instructions,
                remixParent: project_dict.remix.parent,
                remixRoot: project_dict.remix.root,
                favorites: project_dict.stats.favorites,
                loves: project_dict.stats.loves,
                remixes: project_dict.stats.remixes,
                views: project_dict.stats.views,
                title: project_dict.title,
                url: `https://scratch.mit.edu/projects/${project_dict.id}`
            }));

            return projects;
        } catch (error) {
            console.error("Error fetching user's favorite projects:", error);
            return [];
        }
    }
    async favoritesCount() {
        try {
            const response = await fetch(`https://scratch.mit.edu/users/${this.username}/favorites/`, {
                headers: {
                    'x-csrftoken': 'a',
                    'x-requested-with': 'XMLHttpRequest',
                    'Cookie': 'scratchcsrftoken=a;scratchlanguage=en;',
                    'referer': 'https://scratch.mit.edu',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
                }
            });
            const text = await response.text();
            const count = parseInt(text.split("Favorites (")[1].split(")")[0]);
            return isNaN(count) ? 0 : count;
        } catch (error) {
            console.error("Error fetching user's favorites count:", error);
            return 0;
        }
    }
    async toggleCommenting() {
        try {
            await fetch(`https://scratch.mit.edu/site-api/comments/user/${this.username}/toggle-comments/`, {
                method: 'POST',
                headers: this._headers,
                cookies: this._cookies
            });
        } catch (error) {
            console.error("Error toggling commenting on user's profile:", error);
        }
    }
    async viewedProjects(limit = 24, offset = 0) {
        try {
            const response = await fetch(`https://api.scratch.mit.edu/users/${this.username}/projects/recentlyviewed?limit=${limit}&offset=${offset}`, {
                headers: this._headers
            });
            const _projects = await response.json();
            const projects = _projects.map(project_dict => ({
                _session: this._session,
                author: this.username,
                commentsAllowed: project_dict.comments_allowed,
                description: project_dict.description,
                created: project_dict.history.created,
                lastModified: project_dict.history.modified,
                shareDate: project_dict.history.shared,
                id: project_dict.id,
                thumbnailUrl: project_dict.image,
                instructions: project_dict.instructions,
                remixParent: project_dict.remix.parent,
                remixRoot: project_dict.remix.root,
                favorites: project_dict.stats.favorites,
                loves: project_dict.stats.loves,
                remixes: project_dict.stats.remixes,
                views: project_dict.stats.views,
                title: project_dict.title,
                url: `https://scratch.mit.edu/projects/${project_dict.id}`
            }));
            return projects;
        } catch (error) {
            console.error("Error fetching user's recently viewed projects:", error);
            throw new Error('Unauthorized');
        }
    }
    async setBio(text) {
        try {
            await fetch(`https://scratch.mit.edu/site-api/users/all/${this.username}/`, {
                method: 'PUT',
                headers: this._json_headers,
                cookies: this._cookies,
                body: JSON.stringify({
                    comments_allowed: true,
                    id: this.username,
                    bio: text,
                    thumbnail_url: this.iconUrl,
                    userId: this.id,
                    username: this.username
                })
            });

            await fetch("https://scratch.mit.edu/site-api/users/all/YandeMC/", {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Content-Type": "application/json",
                    "X-CSRFToken": `${this._session._headers["x-csrftoken"]}`,
                    "X-Requested-With": "XMLHttpRequest",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "Cookie":
                        ` scratchcsrftoken="${this._session._headers["x-csrftoken"]}"; scratchsessionsid="${this._session.session_id}"`
                },
                "referrer": "https://scratch.mit.edu/users/YandeMC/",
                "body": `{\"id\":\"${this.username}\",\"userId\":${this.id},\"username\":\"YandeMC\",\"thumbnail_url\":\"${this.iconUrl}\",\"bio\":\"\"}`,
                "method": "PUT",
                "mode": "cors"
            });
        } catch (error) {
            console.error("Error setting user's 'About me' section:", error);
        }
    }
    async setWiwo(text) {
        try {
            await fetch(`https://scratch.mit.edu/site-api/users/all/${this.username}/`, {
                method: 'PUT',
                headers: this._json_headers,
                cookies: this._cookies,
                body: JSON.stringify({
                    comments_allowed: true,
                    id: this.username,
                    status: text,
                    thumbnail_url: this.icon_url,
                    userId: this.id,
                    username: this.username
                })
            });
        } catch (error) {
            console.error("Error setting user's 'What I'm working on' section:", error);
        }
    }
    async setFeatured(project_id, { label = "" } = {}) {
        try {
            await fetch(`https://scratch.mit.edu/site-api/users/all/${this.username}/`, {
                method: 'PUT',
                headers: this._json_headers,
                cookies: this._cookies,
                body: JSON.stringify({
                    featured_project: parseInt(project_id),
                    featured_project_label: label
                })
            });
        } catch (error) {
            console.error("Error setting user's featured project:", error);
        }
    }
    async postComment(content, { parent_id = "", commentee_id = "" } = {}) {
        const data = {
            commentee_id: commentee_id,
            content: content,
            parent_id: parent_id
        };

        try {
            const response = await fetch("https://scratch.mit.edu/site-api/comments/user/Epicducks5/add/", {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
                    "Accept": "text/html, */*; q=0.01",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-CSRFToken": `${this._session._headers["x-csrftoken"]}`,
                    "X-Requested-With": "XMLHttpRequest",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "Cookie":
                        ` scratchcsrftoken="${this._session._headers["x-csrftoken"]}"; scratchsessionsid="${this._session.session_id}"`
                },
                "referrer": "https://scratch.mit.edu/users/Epicducks5/",
                "body": JSON.stringify(data),
                "method": "POST",
                "mode": "cors"
            });



            if (!response.ok) {
                console.log(await response.text())
                throw new Error(`Failed to post comment: ${response.statusText}`);
            }

            return await response.text();
        } catch (error) {
            console.error("Error posting comment:", error);
            return error.message;
        }
    }
    async replyComment(content, parent_id, commentee_id = "") {
        return this.postComment(content, { parent_id: parent_id, commentee_id: commentee_id });
    }
    async activity({ limit = 1000 } = {}) {
        try {
            const response = await fetch(`https://scratch.mit.edu/messages/ajax/user-activity/?user=${this.username}&max=${limit}`);
            const html = await response.text();
            return this.parseActivity(html);
        } catch (error) {
            console.error('Error fetching user activity:', error);
            return [];
        }
    }
    async activityHtml({ limit = 1000 } = {}) {
        try {
            const response = await fetch(`https://scratch.mit.edu/messages/ajax/user-activity/?user=${this.username}&max=${limit}`);
            return await response.text();
        } catch (error) {
            console.error('Error fetching user activity HTML:', error);
            return '';
        }
    }
    async follow() {
        try {
            const result = await fetch(`https://scratch.mit.edu/site-api/users/followers/${this.username}/add/?usernames=${this._session.username}`, {
                "credentials": "include",
                "headers": this._headers,
                "referrer": `https://scratch.mit.edu/users/${this.username}/`,
                "body": `{\"id\":\"${this.username}\",\"userId\":${this.id},\"username\":\"${this.username}\",\"thumbnail_url\":\"//uploads.scratch.mit.edu/users/avatars/108245966.png\",\"comments_allowed\":true}`,
                "method": "PUT",
                "mode": "cors"
            });

            if (!result.ok) throw ("Server returned a non-ok status code: " + result.status)
            console.log(`Successfully followed user ${this.username}.`);
            return true
        } catch (error) {
            console.error('Error following user:', error);
            return false
        }
    }
    async unfollow() {

        try {
            const result = await fetch(`https://scratch.mit.edu/site-api/users/followers/${this.username}/remove/?usernames=${this._session.username}`, {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Content-Type": "application/json",
                    "X-CSRFToken": `${this._session._headers["x-csrftoken"]}`,
                    "X-Requested-With": "XMLHttpRequest",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "Cookie":
                        ` scratchcsrftoken="${this._session._headers["x-csrftoken"]}"; scratchsessionsid="${this._session.session_id}"`
                },
                "referrer": `https://scratch.mit.edu/users/${this.username}/`,
                "body": `{\"id\":\"${this.username}\",\"userId\":${this.id},\"username\":\"${this.username}\",\"thumbnail_url\":\"//uploads.scratch.mit.edu/users/avatars/108245966.png\",\"comments_allowed\":true}`,
                "method": "PUT",
                "mode": "cors"
            });

            if (!result.ok) throw ("Server returned a non-ok status code: " + result.status)
            console.log(`Successfully unfollowed user ${this.username}.`);
            return true
        } catch (error) {
            console.error('Error unfollowing user:', error);
            return false
        }
    }
    async deleteComment(comment_id) {
        try {
            await fetch(`https://scratch.mit.edu/site-api/comments/user/${this.username}/del/`, {
                method: 'POST',
                headers: {
                    ...this._headers,
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Send cookies
                body: JSON.stringify({ id: comment_id }),
            });
            console.log(`Successfully deleted comment ${comment_id}.`);
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    }
    async reportComment(comment_id) {
        try {
            await fetch(`https://scratch.mit.edu/site-api/comments/user/${this.username}/rep/`, {
                method: 'POST',
                headers: {
                    ...this._headers,
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Send cookies
                body: JSON.stringify({ id: comment_id }),
            });
            console.log(`Successfully reported comment ${comment_id}.`);
        } catch (error) {
            console.error('Error reporting comment:', error);
        }
    }
    async getComments(URL) {
        try {
            const response = await fetch(URL);
            const pageContents = await response.text();

            const $ = cheerio.load(pageContents);

            const comments = $('li.top-level-reply');

            if (comments.length === 0) {
                return null;
            }

            const DATA = [];

            comments.each((index, element) => {
                const comment = $(element);
                const comment_id = comment.find('div.comment').attr('data-comment-id');
                const user = comment.find('a#comment-user').attr('data-comment-user');
                const content = comment.find('div.content').text().trim();
                const time = comment.find('span.time').attr('title');

                const ALL_REPLIES = [];
                const replies = comment.find('li.reply');

                let hasReplies = false;
                if (replies.length > 0) {
                    hasReplies = true;
                    replies.each((index, replyElement) => {
                        const reply = $(replyElement);
                        const r_comment_id = reply.find('div.comment').attr('data-comment-id');
                        const r_user = reply.find('a#comment-user').attr('data-comment-user');
                        const r_content = reply.find('div.content').text().trim().replace(/\n|\s{20,}/g, ' ');
                        const r_time = reply.find('span.time').attr('title');
                        const reply_data = {
                            'CommentID': r_comment_id,
                            'User': r_user,
                            'Content': r_content,
                            'Timestamp': r_time
                        };
                        ALL_REPLIES.push(reply_data);
                    });
                }

                const main_comment = {
                    'CommentID': comment_id,
                    'User': user,
                    'Content': content,
                    'Timestamp': time,
                    'hasReplies': hasReplies,
                    'Replies': ALL_REPLIES
                };
                DATA.push(main_comment);
            });

            return DATA;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return null;
        }
    }
    async getComments({ page = 1, limit = null }) {
        try {
            const URL = `https://scratch.mit.edu/site-api/comments/user/${this.username}/?page=${page}`;
            const response = await fetch(URL);
            const pageContents = await response.text();

            const $ = cheerio.load(pageContents);

            const comments = $('li.top-level-reply');

            if (comments.length === 0) {
                return [];
            }

            const DATA = [];

            comments.each((index, element) => {
                // Extract comment data and add to DATA array
            });

            // Apply limit if provided
            if (limit !== null) {
                return DATA.slice(0, limit);
            }

            return DATA;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    }
    async getStats() {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/user/info/${this.username}`);
            const userData = await response.json();
            const stats = userData.statistics;
            delete stats.ranks;
            return stats;
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return {
                loves: -1,
                favorites: -1,
                comments: -1,
                views: -1,
                followers: -1,
                following: -1
            };
        }
    }
    async getRanks() {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/user/info/${this.username}`);
            const userData = await response.json();
            return userData.statistics.ranks;
        } catch (error) {
            console.error('Error fetching user ranks:', error);
            return {
                country: {
                    loves: 0,
                    favorites: 0,
                    comments: 0,
                    views: 0,
                    followers: 0,
                    following: 0
                },
                loves: 0,
                favorites: 0,
                comments: 0,
                views: 0,
                followers: 0,
                following: 0
            };
        }
    }
    async getFollowersOverTime({ segment = 1, range = 30 } = {}) {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/user/graph/${this.username}/followers?segment=${segment}&range=${range}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching follower count history:', error);
            return [];
        }
    }
    async getFollowersOverTime({ segment = 1, range = 30 } = {}) {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/user/graph/${this.username}/followers?segment=${segment}&range=${range}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching follower count history:', error);
            return [];
        }
    }
    async getForumCounts() {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/forum/user/info/${this.username}`);
            const data = await response.json();
            return data.counts;
        } catch (error) {
            console.error('Error fetching user forum counts:', error);
            throw new Error('Fetch error');
        }
    }
    async getForumPostsOverTime() {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/forum/user/info/${this.username}`);
            const data = await response.json();
            return data.history;
        } catch (error) {
            console.error('Error fetching user forum posts over time:', error);
            throw new Error('Fetch error');
        }
    }
    async getForumSignature() {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/forum/user/info/${this.username}`);
            const data = await response.json();
            return data.signature;
        } catch (error) {
            console.error('Error fetching user forum signature:', error);
            throw new Error('Fetch error');
        }
    }
    async getForumSignatureHistory() {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/forum/user/history/${this.username}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching user forum signature history:', error);
            throw new Error('Fetch error');
        }
    }
    async getOcularStatus() {
        try {
            const response = await fetch(`https://my-ocular.jeffalo.net/api/user/${this.username}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching user ocular status:', error);
            throw new Error('Fetch error');
        }
    }
    async getForumPosts(page = 0, order = "newest") {
        try {
            const response = await fetch(`https://scratchdb.lefty.one/v3/forum/user/posts/${this.username}/${page}?o=${order}`);
            const data = await response.json();
            return data.map(post => {
                const forumPost = new ForumPost(post.id, this._session);
                forumPost._updateFromObject(post);
                return forumPost;
            });
        } catch (error) {
            console.error('Error fetching forum posts:', error);
            return [];
        }
    }
}

export async function getUser(username) {
    try {

        const user = new User(username);
        await user.update();
        return user;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}