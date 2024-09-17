import VCF, { parseBreakend } from '@gmod/vcf';

export function parse_whole_vcf(header_text, vcf_body_text) {
	const vcf_parser = new VCF({ header: header_text });
	let records = [];
	for (let line of vcf_body_text.split('\n')) {
		let variant = vcf_parser.parseLine(line);
		records.push(variant);
	}
	return records;
}

export function extract_bnd_info_to_strands(alt_for_bnd) {
	// From SplitThreader, given the ALT:
	// 'G]chr5:52747359]' -> strand2 = "+", strand1 = "+"
	// ']13:123456]T' -> strand2 = "+", strand1 = "-"
	// 'T[13:123456[' -> strand2 = "-", strand1 = "+"
	// '[17:198983[A' -> strand2 = "-", strand1 = "-"

	// strand1 is determined by whether the bases are shown before or after the bracketed info.
	// strand2 is determined by which way the brackets are facing, with ] being + and [ being -.

	let parsed_breakend = parseBreakend(alt_for_bnd);
	// e.g. parsed_breakend = {
	// 	MatePosition: 'chr5:52747359',
	// 	Join: 'right',
	// 	Replacement: 'G',
	// 	MateDirection: 'left'
	// };
	let chrom2 = parsed_breakend.MatePosition.split(':')[0];
	let pos2 = parseInt(parsed_breakend.MatePosition.split(':')[1]);
	let strand1 = parsed_breakend.Join === 'right' ? '+' : '-';
	let strand2 = parsed_breakend.MateDirection === 'left' ? '+' : '-';
	return { chrom2, pos2, strand1, strand2 };
}

export function convert_to_splitthreader_format(row) {
	// e.g. row = {
	// 	CHROM: 'chr1',
	// 	POS: 23272628,
	// 	ALT: ['G]chr5:52747359]'],
	// 	INFO: {
	// 		SVTYPE: ['BND'],
	// 		MATEID: ['DRAGEN:BND:63885:0:1:0:0:0:1'],
	// 		SOMATIC: true,
	// 		SOMATICSCORE: [381],
	// 		BND_DEPTH: [127],
	// 		MATE_BND_DEPTH: [136]
	// 	},
	// 	REF: 'G',
	// 	FILTER: 'PASS',
	// 	ID: ['DRAGEN:BND:63885:0:1:0:0:0:0'],
	// 	QUAL: null
	// };

	if (!row) {
		console.warn('Expected VCF row object but it was undefined. Skipping.');
		return null;
	}

	let output = {
		chrom1: row.CHROM,
		pos1: row.POS,
		svtype: row.INFO.SVTYPE?.[0],
		variant_name: row.ID?.[0]
	};

	let alt = row?.ALT?.[0];
	if (alt === undefined) {
		console.warn('ALT field is undefined for row:', row);
		return null;
	}
	if (alt.includes('[') || alt.includes(']')) {
		// BND types should have these brackets in the ALT column.
		output = {
			...output,
			...extract_bnd_info_to_strands(row.ALT?.[0])
		};
	} else {
		if (row.REF == undefined) {
			console.warn('REF field is undefined for row:', row);
			return null;
		}
		if (row.ALT == undefined) {
			console.warn('ALT field is undefined for row:', row);
			return null;
		}
		if (row.ALT.length > 1) {
			console.warn('ALT field has more than one entry:', row.ALT, 'not sure how to handle this yet. Skipping this row:', row);
			return null;
		}
		// If ALT has <> characters, parse it differently.
		if (row.ALT[0].includes('<')) {
			console.warn('ALT field has <> characters:', row.ALT[0], 'not sure how to handle this yet. Skipping this row:', row);

			if (row.ALT[0] == '<DUP:TANDEM>') {
				// Tandem duplication.
				output.chrom2 = output.chrom1;
				output.strand1 = '-';
				output.strand2 = '+';
				if (row.INFO?.END !== undefined) {
					output.pos2 = row.INFO?.END;
				} else if (row.INFO?.SVLEN !== undefined) {
					output.size = row.INFO?.SVLEN;
					output.pos2 = output.pos1 + output.size;
				} else {
					console.warn('Tandem duplication, END expected in INFO field but not found:', row);
					return null;
				}
			}
		} else {
			// If ALT doesn't have brackets or <>, assume REF and ALT contain the actual bases.
			let ref_length = row.REF.length;
			let alt_length = row.ALT[0].length;

			if (ref_length > alt_length) {
				// Deletion
				output.chrom2 = output.chrom1;
				output.size = ref_length - alt_length;
				output.pos2 = output.pos1 + output.size;
				output.strand1 = '+';
				output.strand2 = '-';
			} else if (alt_length > ref_length) {
				// Insertion
				output.chrom2 = output.chrom1;
				output.size = alt_length - ref_length;
				output.pos2 = output.pos1 + 1;
				// +- because the reads still come from the left and then continue to the right after the insertion.
				output.strand1 = '+';
				output.strand2 = '-';
			} else {
				console.warn('This looks like a SNP with REF and ALT both the same size, skipping:', row);	
			}
		}
	}

	// Warn if any fields in output are undefined.
	for (let key in output) {
		if (output[key] === undefined) {
			console.warn(`Warning: "${key}" is undefined in output:`, output);
		}
	}

	if (row?.INFO?.BND_DEPTH) {
		// Assuming BND_DEPTH is somewhat equivalent to how many reads support the breakend.
		output.split = row.INFO.BND_DEPTH[0];
		// Unclear though because MATE_BND_DEPTH differs.
	}
	let sv_type = row?.INFO?.SVTYPE?.[0];
	if (sv_type !== undefined) {
		output.variant_type = sv_type;
	}
	let sv_id = row?.ID?.[0];
	if (sv_id !== undefined) {
		output.name = sv_id;
	}

	return output;
}

function remove_chr(chrom) {
	return chrom.replace(/^chr/, '');
}

export function deduplicate_mates(records) {
	// Given a list of rearrangement records, deduplicate them by their mate positions.
	let seen_mates = new Set();
	let deduplicated_records = [];
	for (let record of records) {
		let self_key = `${record.chrom1}:${record.pos1}`;
		let mate_key = `${record.chrom2}:${record.pos2}`;
		let my_way = `${self_key}-${mate_key}`;
		let their_way = `${mate_key}-${self_key}`;
		if (seen_mates.has(my_way) || seen_mates.has(their_way)) {
			console.log('Skipping duplicate mate:', record);
		} else {
			deduplicated_records.push(record);
			seen_mates.add(my_way);
			seen_mates.add(their_way);
		}
	}
	return deduplicated_records;
}

export function parse_and_convert_vcf(header_text, vcf_body_text, options={}) {
	let vcf_records = parse_whole_vcf(header_text, vcf_body_text);
	let rearrangement_records = vcf_records
		.map(convert_to_splitthreader_format)
		.filter((x) => x !== null);

	if (options.deduplicate_mates) {
		console.log('Deduplicating mates..., num records before:', rearrangement_records.length);
		rearrangement_records = deduplicate_mates(rearrangement_records);
		console.log('Num records after deduplication:', rearrangement_records.length);
	}
	if (options.remove_chr) {
		rearrangement_records = rearrangement_records.map((record) => {
			return {
				...record,
				chrom1: remove_chr(record.chrom1),
				chrom2: remove_chr(record.chrom2)
			};
		});
	}

	if (options.splitthreader_extra_fields) {
		rearrangement_records = rearrangement_records.map((record) => {
			return {
				...record,
				start1: record.pos1,
				stop1: record.pos1,
				start2: record.pos2,
				stop2: record.pos2
			};
		});
	}

	return rearrangement_records;
}
