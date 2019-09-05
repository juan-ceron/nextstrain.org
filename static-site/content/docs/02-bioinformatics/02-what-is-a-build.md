---
title: "The concept of a 'build'"
---

Nextstrain's focus on providing a _real-time_ snapshot of evolving pathogen populations necessitates reproducible analysis that can be rerun when new sequences are available.
The individual steps necessary to repeat analysis together comprise a "build".


Because no two datasets or pathogens are the same, we build augur to be flexible and suitable for different analyses.
The individual augur commands are composable, and can be mixed and matched with other scripts as needed.
These steps, taken together, are what we refer to as a "build".


### Example build

The [zika virus tutorial](docs/tutorials/zika#build-steps) describes a build which contains the following steps:

1. Prepare pathogen sequences and metadata
2. Align sequences
3. Construct a phylogeny from aligned sequences
4. Annotate the phylogeny with inferred ancestral pathogen dates, sequences, and traits
5. Export the annotated phylogeny and corresponding metadata into auspice-readable format

and each of these can be run via a separate `augur` command.




### Snakemake

While it would be possible to run a build by running each of the individual steps -- they're just self-contained commands after all -- we typically group these together into a make-type file.
[Snakemake](https://snakemake.readthedocs.io/en/stable/index.html) is "a tool to create reproducible and scalable data analyses... via a human readable, Python based language."

> Snakemake is installed as part of the [conda environment](docs/getting-started/local-installation#install-augur--auspice-with-conda-recommended) or the [docker container](docs/getting-started/container-installation#install-docker).
If you ever see a build which has a "Snakefile" then you can run this simply by typing `snakemake` or `nextstrain build .`, respectively.


### Next steps

* Have a look at some of the tutorials (listed in the sidebar).
Each one will use a slightly different combination of `augur` commands depending on the pathogen.

* Read about [how to customize a build](customizing-a-build)
