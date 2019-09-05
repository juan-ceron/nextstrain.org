const AWS = require("aws-sdk");
const S3 = new AWS.S3();

/* These Source and Dataset classes contain information to map an array of
 * dataset path parts onto a URL.  Source selection and dataset path aliasing
 * (/flu → /flu/seasonal/h3n2/ha/3y) is handled in
 * getDatasetHelpers.parsePrefix().
 *
 * The class definitions would be a bit shorter/prettier if we were using Babel
 * to allow class properties on Node.
 */

class Source {
  get name() {
    throw "name() must be implemented by subclasses";
  }
  get baseUrl() {
    throw "baseUrl() must be implemented by subclasses";
  }
  dataset(pathParts) {
    return new Dataset(this, pathParts);
  }
  visibleToUser(user) {
    return true;
  }
  availableDatasets() {
    return [];
  }
  availableNarratives() {
    return [];
  }
}

class Dataset {
  constructor(source, pathParts) {
    this.source = source;
    this.pathParts = pathParts;
  }
  get baseParts() {
    return this.pathParts.slice();
  }
  baseNameFor(type) {
    const baseName = this.baseParts.join("_");
    return `${baseName}_${type}.json`;
  }
  urlFor(type) {
    const url = new URL(this.baseNameFor(type), this.source.baseUrl);
    return url.toString();
  }
}

class LiveSource extends Source {
  get name() { return "live" }
  get baseUrl() { return "http://data.nextstrain.org/" }

  // The computation of these globals should move here.
  availableDatasets() {
    return global.availableDatasets[this.name] || [];
  }
  availableNarratives() {
    return global.availableNarratives[this.name] || [];
  }
}

class StagingSource extends Source {
  get name() { return "staging" }
  get baseUrl() { return "http://staging.nextstrain.org/" }

  // The computation of these globals should move here.
  availableDatasets() {
    return global.availableDatasets[this.name] || [];
  }
  availableNarratives() {
    return global.availableNarratives[this.name] || [];
  }
}

class CommunitySource extends Source {
  get name() { return "community" }
  dataset(pathParts) {
    return new CommunityDataset(this, pathParts);
  }
}

class CommunityDataset extends Dataset {
  get baseParts() {
    // First part is the GitHub user/org.  The repo name is the second part,
    // which we also expect in the file basename.
    return this.pathParts.slice(1);
  }
  urlFor(type) {
    const repoBaseUrl = `https://raw.githubusercontent.com/${this.pathParts[0]}/${this.pathParts[1]}/master/auspice/`;
    const url = new URL(this.baseNameFor(type), repoBaseUrl);
    return url.toString();
  }
}

class PrivateS3Source extends Source {
  dataset(pathParts) {
    return new PrivateS3Dataset(this, pathParts);
  }
  visibleToUser(user) {
    throw "visibleToUser() must be implemented explicitly by subclasses (not inherited from Source)";
  }
  async availableDatasets() {
    // XXX TODO: This will only return the first 1000 objects.  That's fine for
    // now (for comparison, nextstrain-data only has ~500), but we really
    // should iterate over the whole bucket contents using the S3 client's
    // pagination support.
    //   -trs, 30 Aug 2019
    const list = await S3.listObjectsV2({Bucket: this.bucket}).promise();

    // Walking logic borrowed from auspice's cli/server/getAvailable.js
    return list.Contents
      .map(object => object.Key)
      .filter(file => file.endsWith("_tree.json"))
      .map(file => file
        .replace(/_tree[.]json$/, "")
        .split("_")
        .join("/"))
      .map(path => ({request: [this.name, path].join("/")}));
  }
}

class PrivateS3Dataset extends Dataset {
  urlFor(type) {
    return S3.getSignedUrl("getObject", {
      Bucket: this.source.bucket,
      Key: this.baseNameFor(type)
    });
  }
}

class InrbDrcSource extends PrivateS3Source {
  get name() { return "inrb-drc" }
  get bucket() { return "nextstrain-inrb" }

  visibleToUser(user) {
    return !!user && !!user.groups && user.groups.includes("inrb");
  }
}

module.exports = new Map([
  ["live", new LiveSource()],
  ["staging", new StagingSource()],
  ["community", new CommunitySource()],
  ["inrb-drc", new InrbDrcSource()],
]);