import { Request, Response } from 'express';
export declare const userController: {
    checkFollowStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    followUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    unfollowUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=userController.d.ts.map