
export const EXAMPLE_SESSIONS = [
  {
    name: "GIAB HG008 DRAGEN (vcf only)",
    vcf: [
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/analysis/DRAGEN-v4.2.4_ILMN-WGS_20240312/standard/dragen_4.2.4_HG008-mosaic_tumor.sv.vcf.gz",
    ],
    annotation_id: "GRCh38",
  },
  {
    name: "skbr3",
    bedpe_backend: "resources/examples/skbr3.bedpe.csv",
    coverage_backend: "resources/examples/skbr3.coverage.bed",
    annotation_id: "hg19",
  },
  // {
  //   name: "bedpe without coverage",
  //   bedpe_backend: "resources/examples/skbr3.bedpe.csv",
  //   // coverage_backend: "resources/examples/skbr3.coverage.bed",
  // },
  // {
  //   name: "coverage without bedpe",
  //   // bedpe_backend: "resources/examples/skbr3.bedpe.csv",
  //   coverage_backend: "resources/examples/skbr3.coverage.bed",
  // },
];
