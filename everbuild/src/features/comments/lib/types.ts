export const MAX_COMMENT_LENGTH = 4000;

export type ProjectComment = {
  id: string;
  body: string;
  createdAt: string;
  hidden: boolean;
  author: {
    id: string;
    name: string;
    role: "creator" | "company";
    isVerifiedCompany: boolean;
  };
};

export type CommentFormState = { error?: string; ok?: number };
