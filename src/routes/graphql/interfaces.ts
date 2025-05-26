export interface UserSubscribedTo {
  userId: string;
  authorId: string;
}

export interface User {
  id: string;
  name: string;
  balance: number;
}

export interface CreateUser {
  dto: {
    name: string;
    balance: number;
  };
}

export interface ChangeUser {
  id: string;
  dto: {
    name: string;
    balance: number;
  };
}

export interface Profile {
  id: string;
  isMale: boolean;
  yearOfBirth: number;
  userId: string;
  memberTypeId: string;
}

export interface CreateProfile {
  dto: {
    userId: string;
    memberTypeId: string;
    isMale: boolean;
    yearOfBirth: number;
  };
}

export interface ChangeProfile {
  id: string;
  dto: {
    memberTypeId: string;
    isMale: boolean;
    yearOfBirth: number;
  };
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

export interface CreatePost {
  dto: {
    authorId: string;
    title: string;
    content: string;
  };
}

export interface ChangePost {
  id: string;
  dto: {
    authorId: string;
    title: string;
    content: string;
  };
}

export interface Member {
  id: string;
  discount: number;
  postsLimitPerMonth: number;
}