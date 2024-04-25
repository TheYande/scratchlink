import { User, getUser } from "./sl/user.js";
let user = new User("yandemc")
await user.update()
console.log(await user.isFollowing("griffpatch"))