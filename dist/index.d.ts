import { WebSocket } from 'ws';
import events from 'node:events';
import events$1 from 'events';
import { HTMLElement } from 'node-html-parser';

interface SessionJSON {
    user: {
        id: number;
        banned: boolean;
        should_vpn: boolean;
        username: string;
        token: string;
        thumbnailUrl: string;
        dateJoined: string;
        email: string;
    };
    permissions: {
        admin: boolean;
        scratcher: boolean;
        new_scratcher: boolean;
        invited_scratcher: boolean;
        social: boolean;
        educator: boolean;
        educator_invitee: boolean;
        student: boolean;
        mute_status: {
            offenses: {
                expiresAt: number;
                messageType: string | null;
            }[];
            showWarning: boolean;
            muteExpiresAt: number;
            currentMessageType: string | null;
        } | {};
    };
    flags: {
        must_reset_password: boolean;
        must_complete_registration: boolean;
        has_outstanding_email_confirmation: boolean;
        show_welcome: boolean;
        confirm_email_banner: boolean;
        unsupported_browser_banner: boolean;
        project_comments_enabled: boolean;
        gallery_comments_enabled: boolean;
        userprofile_comments_enabled: boolean;
        everything_is_totally_normal: boolean;
    };
}
type Session = ScratchSession | undefined;

type PartialMessage = {
    id: number;
    datetime_created: string;
    actor_username: string;
    actor_id: number;
};
type Message = PartialMessage & ({
    type: "studioactivity";
    gallery_id: number;
    title: string;
} | {
    type: "forumpost";
    topic_id: number;
    topic_title: string;
} | {
    type: "addcomment";
    comment_type: number;
    comment_obj_id: number;
    comment_id: number;
    comment_fragment: string;
    comment_obj_title: string;
    commentee_username: string;
} | {
    type: "followuser";
    followed_user_id: number;
    followed_username: string;
} | {
    type: "loveproject";
    project_id: number;
    title: string;
} | {
    type: "favoriteproject";
    project_id: number;
    project_title: string;
} | {
    type: "remixproject";
    title: string;
    parent_id: number;
    parent_title: string;
} | {
    type: "becomehoststudio";
    former_host_username: string;
    recipient_id: number;
    recipient_username: string;
    gallery_id: number;
    gallery_title: string;
    admin_actor: boolean;
} | {
    type: "curatorinvite";
    title: string;
    gallery_id: number;
});
/**
 * Manages a Scratch session.
 */
declare class ScratchSession {
    auth?: {
        username: string;
        csrfToken: string;
        token: string;
        cookieSet: string;
        sessionJSON: SessionJSON;
    };
    /**
     * Sets up the ScratchSession to use authenticated functions.
     * @param user The username of the user you want to log in to.
     * @param pass The password of the user you want to log in to.
     */
    init(user: string, pass: string): Promise<void>;
    /**
     * Uploads a file to assets.scratch.mit.edu.
     * This can be used for adding images to be used in a forum post or signature.
     * @param buffer The buffer of the file you want to upload.
     * @param fileExtension The extension of the file you want to upload, for example "png".
     * @returns The URL to access the file you have uploaded.
     * @example
     * await session.uploadToAssets(fs.readFileSync("photo.png"), "png"); // returns URL to image
     */
    uploadToAssets(buffer: Buffer, fileExtension: string): Promise<string>;
    /**
     * Search projects
     * @param query The query to search for
     * @param limit The limit of
     * @param offset The number of projects to offset
     * @param mode Search using Popular or Trending mode
     */
    searchProjects(query: string, limit?: number, offset?: number, mode?: "popular" | "trending"): Promise<{
        id: number;
        title: string;
        description: string;
        instructions: string;
        visibility: string;
        public: boolean;
        comments_allowed: boolean;
        is_published: boolean;
        author: {
            id: number;
            username: string;
            scratchteam: boolean;
            history: {
                joined: string;
            };
            profile: {
                id: unknown;
                images: {
                    "90x90": string;
                    "60x60": string;
                    "55x55": string;
                    "50x50": string;
                    "32x32": string;
                };
            };
        };
    }[]>;
    /**
     * Get messages
     * @param limit The limit of messages to get
     * @param offset The offset of messages
     */
    getMessages(limit?: number, offset?: number): Promise<Message[]>;
    /**
     * Logs out of Scratch.
     */
    logout(): Promise<void>;
}

interface UserAPIResponse {
    id: number;
    username: string;
    scratchteam: boolean;
    history: {
        joined: string;
    };
    profile: {
        id: number;
        images: {
            "90x90": string;
            "60x60": string;
            "55x55": string;
            "50x50": string;
            "32x32": string;
        };
        status: string;
        bio: string;
        country: string;
    };
}
interface ProfileCommentReply {
    id: string;
    username: string;
    content: string;
    apiID: string;
}
interface ProfileComment {
    id: string;
    username: string;
    content: string;
    apiID: string;
    replies: ProfileCommentReply[];
}
/**
 * Class for profiles.
 * @param session The ScratchSession that will be used.
 * @param username The username of the profile you want to get.
 */
declare class Profile {
    user: string;
    session: Session;
    constructor(session: Session, username: string);
    /**
     * Gets the status of the user.
     * Can either be Scratcher, New Scratcher, or Scratch Team.
     * @returns {string} The status of the user.
     */
    getStatus(): Promise<"Scratcher" | "New Scratcher" | "Scratch Team">;
    /**
     * Follow the user
     */
    follow(): Promise<void>;
    /**
     * Unfollow the user
     */
    unfollow(): Promise<void>;
    /**
     * Comment on a profile
     */
    comment(content: string, parent_id?: number, commentee_id?: number): Promise<void>;
    /**
     * Deletes a comment.
     * @param id The comment ID, for example 12345, *not* comment-12345.
     */
    deleteComment(id: string | number): Promise<void>;
    private getUserHTML;
    /**
     * Gets the API response of the user in the Profile.
     * @returns The API response of the user.
     */
    getUserAPI(): Promise<UserAPIResponse>;
    /**
     * Get the message count
     * @returns The number of messages
     */
    getMessageCount(): Promise<number>;
    /**
     * Gets comments on the user's profile.
     * @param page The page to look at.
     * @returns An array of comments.
     * apiID is used to input into deleteComment.
     */
    getComments(page?: number): Promise<ProfileComment[]>;
    /**
     * Toggle the comments section on the profile
     */
    toggleComments(): Promise<void>;
}

interface OldProjectResponse {
    id: number;
    title: string;
    image: string;
    creator_id: number;
    username: string;
    avatar: {
        "90x90": string;
        "60x60": string;
        "55x55": string;
        "50x50": string;
        "32x32": string;
    };
    actor_id: number;
}
interface StudioAPIResponse {
    id: number;
    title: string;
    host: number;
    description: string;
    visibility: "visible" | "hidden";
    public: boolean;
    open_to_all: boolean;
    comments_allowed: boolean;
    image: string;
    history: {
        created: string;
        modified: string;
    };
    stats: {
        comments: number;
        followers: number;
        managers: number;
        projects: number;
    };
}
/**
 * Class for studios.
 * @param session The ScratchSession that will be used.
 * @param id The id of the studio you want to get.
 */
declare class Studio {
    id: number;
    session: Session;
    constructor(session: Session, id: number);
    /**
     * Get the API data of the studio
     */
    getAPIData(): Promise<StudioAPIResponse>;
    /**
     * Follow the studio
     */
    follow(): Promise<void>;
    /**
     * Unfollow the studio
     */
    unfollow(): Promise<void>;
    /**
     * Sets the title of the studio.
     * @param value The value to set the title to.
     */
    setTitle(value: string): Promise<void>;
    /**
     * Sets the description of the studio.
     * @param value The value to set the description to.
     */
    setDescription(value: string): Promise<void>;
    /**
     * Invites a curator to the studio.
     * @param username The username of the user to add.
     */
    inviteCurator(username: string): Promise<void>;
    /**
     * Removes a curator from the studio.
     * @param username The username of the user to remove.
     */
    removeCurator(username: string): Promise<void>;
    /**
     * Accepts an invite to a studio
     * You can check if you have an invite with the getUserData function
     */
    acceptInvite(): Promise<void>;
    /**
     * Check if you are a manager, a curator, invited, or following the studio
     */
    getUserData(): Promise<{
        manager: boolean;
        curator: boolean;
        invited: boolean;
        following: boolean;
    }>;
    /**
     * Adds a project to the studio.
     * @param project The project ID to add to the studio.
     */
    addProject(project: number): Promise<void>;
    /**
     * Removes a project from the studio.
     * @param project The project ID to remove from the studio.
     */
    removeProject(project: number): Promise<void>;
    /**
     * Comment on a studio
     * @param content The content of the
     * @param parent_id The comment ID of the parent
     * @param commentee_id The ID of the user to ping in the starting
     */
    comment(content: string, parent_id?: number, commentee_id?: number): Promise<number>;
    /**
     * Toggle comments on or off
     */
    toggleComments(): Promise<void>;
    /**
     * Gets the curators in a studio.
     * @param limit The limit of curators to return.
     * @param offset The offset of the curators to return.
     * @returns An array of curators.
     */
    getCurators(limit?: number, offset?: number): Promise<UserAPIResponse[]>;
    /**
     * Gets the managers in a studio.
     * @param limit The limit of managers to return.
     * @param offset The offset of the managers to return.
     * @returns An array of managers.
     */
    getManagers(limit?: number, offset?: number): Promise<UserAPIResponse[]>;
    /**
     * Gets the projects in a studio.
     * @param limit The limit of projects to return.
     * @param offset The offset of the projects to return.
     * @returns An array of users.
     */
    getProjects(limit?: number, offset?: number): Promise<OldProjectResponse[]>;
}

interface ProjectAPIResponse {
    id: number;
    title: string;
    description: string;
    instructions: string;
    visibility: string;
    public: boolean;
    comments_allowed: boolean;
    is_published: boolean;
    author: {
        id: number;
        username: string;
        scratchteam: boolean;
        history: {
            joined: string;
        };
        profile: {
            id: number;
            images: {
                "90x90": string;
                "60x60": string;
                "55x55": string;
                "50x50": string;
                "32x32": string;
            };
        };
    };
    image: string;
    images: {
        "282x218": string;
        "216x163": string;
        "200x200": string;
        "144x108": string;
        "135x102": string;
        "100x80": string;
    };
    history: {
        created: string;
        modified: string;
        shared: string;
    };
    stats: {
        views: number;
        loves: number;
        favorites: number;
        remixes: number;
    };
    remix: {
        parent: null | number;
        root: null | number;
    };
    project_token: string;
}
interface ProjectComment {
    id: number;
    parent_id: null;
    commentee_id: null;
    content: string;
    datetime_created: string;
    datetime_modified: string;
    visibility: "visible" | "hidden";
    author: {
        id: number;
        username: string;
        scratchteam: boolean;
        image: string;
    };
}
interface ProjectCommentReply {
    id: number;
    parent_id: number;
    commentee_id: number;
    content: string;
    datetime_created: string;
    datetime_modified: string;
    visibility: "visible" | "hidden";
    author: {
        id: number;
        username: string;
        scratchteam: boolean;
        image: string;
    };
    reply_count: number;
}
/**
 * Class for projects.
 * @param session The ScratchSession that will be used.
 * @param id The id of the project you want to get.
 */
declare class Project {
    id: number;
    session: Session;
    constructor(session: Session, id: number);
    /**
     * Gets the api.scratch.mit.edu response of the project.
     */
    getAPIData(): Promise<ProjectAPIResponse>;
    /**
     * Gets comments in the project.
     * @param offset The offset of comments.
     * @param limit The limit of comments to return.
     * @returns The comments.
     */
    getComments(offset?: number, limit?: number): Promise<ProjectComment[]>;
    /**
     * Gets the replies to a comment.
     * @param offset The offset of comments.
     * @param limit The limit of comments to return.
     * @param id The id of the comment to get.
     * @returns The comment replies.
     */
    getCommentReplies(id: number | string, offset?: number, limit?: number): Promise<ProjectCommentReply[]>;
    /**
     * Comment on a project
     * @param content The content of the
     * @param parent_id The comment ID of the parent
     * @param commentee_id The ID of the user to ping in the starting
     */
    comment(content: string, parent_id?: number, commentee_id?: number): Promise<number>;
    /**
     * Set if comments should be allowed or not
     */
    setCommentsAllowed(state: boolean): Promise<void>;
    /**
     * Sets the title of the project (requires ownership of the project).
     * @param value The value you want to set the title to.
     */
    setTitle(value: string): Promise<void>;
    /**
     * Sets the instructions of the project (requires ownership of the project).
     * @param value The value you want to set the instructions to.
     */
    setInstructions(value: string): Promise<void>;
    /**
     * Sets the Notes and Credits of the project (requires ownership of the project).
     * @param value The value you want to set the Notes and Credits to.
     */
    setNotesAndCredits(value: string): Promise<void>;
    /**
     * Set the thumbnail of the project
     * @param buffer The buffer of the thumbnail image file
     */
    setThumbnail(buffer: Buffer): Promise<void>;
    /**
     * Unshares the project (requires ownership of the project).
     */
    unshare(): Promise<void>;
    /**
     * Check if the user is loving the project
     */
    isLoving(): Promise<boolean>;
    /**
     * Check if the user is favoriting the project
     */
    isFavoriting(): Promise<boolean>;
    /**
     * Set the state for loving the project
     * Note that if you want to set up a toggle you want to also use the Project.isLoving() function
     * @param loving Either true or false
     */
    setLoving(loving: boolean): Promise<void>;
    /**
     * Set the state for favoriting the project
     * Note that if you want to set up a toggle you want to also use the Project.isFavoriting() function
     * @param favoriting Either true or false
     */
    setFavoriting(favoriting: boolean): Promise<void>;
    /**
     * Shares the project (requires ownership of the project).
     */
    share(): Promise<void>;
}

/**
 * Class for cloud connections.
 * @param session The ScratchSession that will be used.
 * @param id The id of the project to connect to.
 * @returns {Profile} The profile of the user.
 */
declare class CloudConnection extends events.EventEmitter {
    id: number;
    session: Session;
    connection: WebSocket;
    open: boolean;
    queue: Array<{
        user: string;
        method: string;
        name: string;
        value: string;
        project_id: number;
    }>;
    variables: Map<string, string>;
    disconnected: boolean;
    constructor(session: Session, id: number);
    private connect;
    /**
     * Sends a packet through cloud.
     */
    private send;
    /**
     * Sets a cloud variable.
     * @param variable The variable name to set.
     * @param value The value to set the variable to.
     */
    setVariable(variable: string, value: number | string): void;
    /**
     * Gets a cloud variable.
     * @param variable The variable name to get.
     * @returns The value of the variable in string format if it exists.
     */
    getVariable(variable: string): string | undefined;
    /**
     * Closes the cloud connection.
     */
    close(): void;
}

declare class PacketCloud extends events$1.EventEmitter {
    connection: CloudConnection;
    onRequest: symbol;
    constructor(connection: CloudConnection);
    send(name: string, value: string): void;
}

declare class CloudEncoder {
    charset: string[];
    encode(string: string): string;
    decode(string: string): Generator<string, void, unknown>;
}

declare class Post {
    id: number;
    session: Session;
    data?: {
        content: string;
        parsableContent: HTMLElement;
        author: string;
        time: Date;
    };
    constructor(session: Session, id: number, data?: {
        content: string;
        parsableContent: HTMLElement;
        author: string;
        time: Date;
    });
    /**
     * Gets data from the Scratch website and sets the Post.data
     */
    setData(): Promise<void>;
    /**
     * Get the BBCode source of the post
     * @returns The source of the post
     */
    getSource(): Promise<string>;
    /**
     * Edits the post (requires ownership of the post)
     * @param content The new content of the post
     */
    edit(content: string): Promise<void>;
}

declare class Topic {
    id: number;
    session: Session;
    data?: {
        sticky?: boolean;
        title: string;
        replyCount: number;
    };
    constructor(session: Session, id: number, data?: {
        sticky: boolean;
        title: string;
        replyCount: number;
    });
    /**
     * Gets data from the Scratch website and sets the Topic.data
     */
    setData(): Promise<void>;
    /**
     * Gets some the posts in the topic.
     * @returns An array of posts in the topic.
     */
    getPosts(page?: number): Promise<Post[]>;
    /**
     * Reply to the topic
     * @param body The body of the post
     */
    reply(body: string): Promise<void>;
    /**
     * Follows the topic.
     */
    follow(): Promise<void>;
    /**
     * Unfollows the topic.
     */
    unfollow(): Promise<void>;
}

/**
 * Class for profiles.
 * @param session The ScratchSession that will be used.
 * @param [id] The ID of the forum you want to get.
 */
declare class Forum {
    id?: number;
    session: Session;
    constructor(session: Session, id?: number);
    /**
     * Gets a list of topics.
     * @returns An array of topics.
     */
    getTopics(page?: number): Promise<Topic[]>;
    /**
     * Create a topic
     * @param title The title of the topic
     * @param body The body of the topic
     */
    createTopic(title: string, body: string): Promise<void>;
    /**
     * Sets the currently logged in user's signature
     * @param content The content to set the signature to
     */
    setSignature(content: string): Promise<void>;
}

export { CloudConnection, CloudEncoder as CloudSerialiser, Forum, PacketCloud, Post, Profile, Project, ScratchSession, Studio, Topic };
