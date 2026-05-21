
export interface TestParams {
    number?: string;
};

export interface SuccessResponse<T = unknown> {
    success: true;
    message: string;
    data?: T;
};

export interface ErrorResponse {
    success: false;
    message: string;
    details?: unknown;
};