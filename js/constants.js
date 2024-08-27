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
    bedpe: "/resources/examples/skbr3.bedpe.csv",
    coverage: "/resources/examples/skbr3.coverage.bed",
    annotation_id: "hg19",
  },
  {
    name: "Revio HG008 Tumor/Normal",
    bam: [
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/PacBio_Revio_20240125/HG008-T_PacBio-HiFi-Revio_20240125_116x_CHM13v2.0.bam",
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/PacBio_Revio_20240125/HG008-N-P_PacBio-HiFi-Revio_20240125_35x_CHM13v2.0.bam",
    ]
  },
  // {
  //   name: "bedpe without coverage",
  //   bedpe: "/resources/examples/skbr3.bedpe.csv",
  //   // coverage: "/resources/examples/skbr3.coverage.bed",
  // },
  // {
  //   name: "coverage without bedpe",
  //   // bedpe: "/resources/examples/skbr3.bedpe.csv",
  //   coverage: "/resources/examples/skbr3.coverage.bed",
  // },
];
