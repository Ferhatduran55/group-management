import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export default class {
  static db: null;
  static dbFilePath = path.join(process.cwd(), "db.json");

  static async context() {
    return this.db;
  }

  static encryptData(plain: string, key: string, iv: string) {
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(plain, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  }

  static decryptData(encrypted: string, key: string, iv: string) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  static async readData() {
    const data = await fs.readFile(this.dbFilePath, "utf8");
    const dbData = JSON.parse(data);
    if (dbData.encrypt) {
      const { key, iv } = dbData.encryption;
      dbData.database.forEach((col: any) => {
        if (typeof col.data === "string") {
          const decrypted = this.decryptData(col.data, key, iv);
          col.data = JSON.parse(decrypted);
        }
      });
    } else {
      dbData.database.forEach((col: any) => {
        if (typeof col.data === "string") {
          throw new Error(
            "Unable to access the encrypted table"
          );
        }
      });
    }
    return dbData;
  }

  static async writeData(newData: any) {
    if (newData.encrypt) {
      const { key, iv } = newData.encryption;
      newData.database.forEach((col: any) => {
        if (Array.isArray(col.data)) {
          const encrypted = this.encryptData(JSON.stringify(col.data), key, iv);
          col.data = encrypted;
        }
      });
    } else {
      newData.database.forEach((col: any) => {
        if (typeof col.data === "string") {
          throw new Error(
            "Unable to access the encrypted table"
          );
        }
      });
    }
    await fs.writeFile(
      this.dbFilePath,
      JSON.stringify(newData, null, 2),
      "utf8"
    );
  }

  static async find(schema: string, filter: any = {}) {
    const dbData = await this.readData();
    const collection = dbData.database.find(
      (col: any) => col.__schema__ === schema
    );
    if (!collection) return [];
    return collection.data.filter((item: any) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  static async findOne(schema: string, filter: any = {}) {
    const dbData = await this.readData();
    const collection = dbData.database.find(
      (col: any) => col.__schema__ === schema
    );
    if (!collection) return null;
    return (
      collection.data.find((item: any) => {
        for (const key in filter) {
          if (item[key] !== filter[key]) return false;
        }
        return true;
      }) || null
    );
  }

  static generateUniqueKey() {
    // Rough pseudo–UUID v6: time-based with versioning
    const nowHex = Date.now().toString(16).padStart(12, '0');
    const rnd = crypto.randomBytes(10).toString('hex');
    // Place '6' in the version nibble
    // This is not a standardized approach, but simulates a v6-like format
    return `${nowHex.slice(0, 8)}-6${nowHex.slice(8,12)}-${rnd}`;
  }

  static async generateCollisionFreeKey() {
    let key: string = "";
    let collision = true;
    while (collision) {
      key = this.generateUniqueKey();
      collision = false;
      const dbData = await this.readData();
      for (const col of dbData.database) {
        if (col.data.some((doc: any) => doc.identifier === key)) {
          collision = true;
          break;
        }
      }
    }
    return key;
  }

  static async insertOne(schema: string, doc: any) {
    const dbData = await this.readData();
    let collection = dbData.database.find(
      (col: any) => col.__schema__ === schema
    );
    if (!collection) {
      collection = { __schema__: schema, context: "", data: [] };
      dbData.database.push(collection);
    }
    if (!doc.identifier) {
      doc.identifier = await this.generateCollisionFreeKey();
    }
    collection.data.push(doc);
    await this.writeData(dbData);
    return doc;
  }

  static async insertMany(schema: string, docs: any[]) {
    const dbData = await this.readData();
    let collection = dbData.database.find(
      (col: any) => col.__schema__ === schema
    );
    if (!collection) {
      collection = { __schema__: schema, context: "", data: [] };
      dbData.database.push(collection);
    }
    for (const doc of docs) {
      if (!doc.identifier) {
        doc.identifier = await this.generateCollisionFreeKey();
      }
      collection.data.push(doc);
    }
    await this.writeData(dbData);
    return docs;
  }

  static async updateOne(schema: string, filter: any, update: any) {
    const dbData = await this.readData();
    const collection = dbData.database.find(
      (col: any) => col.__schema__ === schema
    );
    if (!collection) return null;
    const index = collection.data.findIndex((item: any) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
    if (index === -1) return null;
    collection.data[index] = { ...collection.data[index], ...update };
    await this.writeData(dbData);
    return collection.data[index];
  }

  static async deleteOne(schema: string, filter: any) {
    const dbData = await this.readData();
    const collection = dbData.database.find(
      (col: any) => col.__schema__ === schema
    );
    if (!collection) return null;
    const index = collection.data.findIndex((item: any) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
    if (index === -1) return null;
    const removed = collection.data.splice(index, 1)[0];
    await this.writeData(dbData);
    return removed;
  }

  static async deleteMany(schema: string, filter: any = {}) {
    const dbData = await this.readData();
    const collection = dbData.database.find(
      (col: any) => col.__schema__ === schema
    );
    if (!collection) return 0;
    let removedCount = 0;
    collection.data = collection.data.filter((item: any) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return true;
      }
      removedCount++;
      return false;
    });
    await this.writeData(dbData);
    return removedCount;
  }

  static async findAll() {
    const dbData = await this.readData();
    return dbData.database;
  }

  static async findAllIn(schema: string) {
    const dbData = await this.readData();
    const collection = dbData.database.find((col: any) => col.__schema__ === schema);
    if (!collection) return [];
    return collection.data;
  }

  static async findWithRelations(
    schema: string,
    filter: any = {},
    relations: {key: string; refSchema: string; refKey: string}[]
  ) {
    const records = await this.find(schema, filter);
    for (const record of records) {
      for (const relation of relations) {
        const val = record[relation.key];
        if (!val) continue;
        const relatedData = await this.find(
          relation.refSchema,
          { [relation.refKey]: val }
        );
        record[relation.refSchema] = relatedData;
      }
    }
    return records;
  }

  static async upsertOne(schema: string, filter: any, doc: any) {
    const existing = await this.findOne(schema, filter);
    if (existing) {
      return await this.updateOne(schema, filter, doc);
    } else {
      return await this.insertOne(schema, doc);
    }
  }
}
