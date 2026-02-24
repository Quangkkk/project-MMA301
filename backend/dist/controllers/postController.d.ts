import { Request, Response } from 'express';
export declare const postController: {
    getPosts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTrendingPosts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getFollowingPosts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getSavedPosts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getPopularTags(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserPosts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createPost(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deletePost(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updatePost(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=postController.d.ts.map