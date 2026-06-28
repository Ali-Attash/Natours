import type { Query } from "mongoose";
import type { ParsedQs } from "qs";

class APIFeatures<T> {
  mongooseQuery: Query<T[], T>;
  queryString: ParsedQs;

  constructor(mongooseQuery: Query<T[], T>, queryString: ParsedQs) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedField: string[] = ["page", "sort", "limit", "fields"];
    excludedField.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.mongooseQuery.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = (this.queryString.sort as string).split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }
    return this;
  }
  field() {
    if (this.queryString.fields) {
      const fields = (this.queryString.fields as string).split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }

  paginate() {
    if (this.queryString.page || this.queryString.limit) {
      const page = Math.max(Number(this.queryString.page) || 1, 1);
      const limit = Math.max(Number(this.queryString.limit) || 5, 1);
      const skip = (page - 1) * limit;
      this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    }

    return this;
  }
}

export default APIFeatures;
