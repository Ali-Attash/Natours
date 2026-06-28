type RouteParams = {
    id: string
};

type Tour = {
    id: number,
    [key: string]: any
}

 type UserType = {
     name: string,
     position: string,
     salary: number
    [key: string]: any;
};


export type { RouteParams, Tour, UserType };