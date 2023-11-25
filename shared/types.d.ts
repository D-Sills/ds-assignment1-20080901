  // Used to validate the query string og HTTP Get requests
  export type MovieCastMemberQueryParams = {
    movieId: string;
    actorName?: string;
    roleName?: string
  }
  
  export type MovieReview = {
    movieId: number;
    reviewerId: string;
    reviewDate: string;
    Content: string;
    rating: number;
  }
  
  export type User = {
    userId: string;
    name: string;
    email: string;
    password: string;
  }