/* -*- mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil -*- */

// 
// Dalliance Genome Explorer
// (c) Thomas Down 2006-2011
//
// bam.js: indexed binary alignments
//

var BAM_MAGIC = 21840194;
var BAI_MAGIC = 21578050;
var CSI_MAGIC = 21582659;

function BamFile() {
}

function Vob(b, o) {
    this.block = b;
    this.offset = o;
}

Vob.prototype.toString = function() {
    return '' + this.block + ':' + this.offset;
}

function Chunk(minv, maxv) {
    this.minv = minv; this.maxv = maxv;
}

function makeBam(data, index, callback) {
    var bam = new BamFile();
    bam.data = data;
    bam.index = index;
    bam.min_shift = 14;
    bam.depth = 5;

    bam.data.slice(0, 65536).fetch(function(r) {
        if (!r) {
            return alert("Couldn't access BAM");
        }

        var unc = unbgzf(r);
        var uncba = new Uint8Array(unc);

        var magic = readInt(uncba, 0);
        var headLen = readInt(uncba, 4);
        var header = '';
        for (var i = 0; i < headLen; ++i) {
            header += String.fromCharCode(uncba[i + 8]);
        }
        bam.header = header;
        var nRef = readInt(uncba, headLen + 8);
        var p = headLen + 12;

        bam.chrToIndex = {};
        bam.indexToChr = [];
        for (var i = 0; i < nRef; ++i) {
            var lName = readInt(uncba, p);
            var name = '';
            for (var j = 0; j < lName-1; ++j) {
                name += String.fromCharCode(uncba[p + 4 + j]);
            }
            var lRef = readInt(uncba, p + lName + 4);
            // dlog(name + ': ' + lRef);
            bam.chrToIndex[name] = i;
            if (name.indexOf('chr') == 0) {
                bam.chrToIndex[name.substring(3)] = i;
            } else {
                bam.chrToIndex['chr' + name] = i;
            }
            bam.indexToChr.push(name);

            p = p + 8 + lName;
        }

        if (bam.indices) {
            return callback(bam);
        }
    });

    bam.index.fetch(function(header) {   // Do we really need to fetch the whole thing? :-(
        if (!header) {
            return alert("Couldn't access index file");
        }

	var uncba = new Uint8Array(header);
	var indexMagic = readInt(uncba, 0);
	if (indexMagic == BAI_MAGIC) {
		bam.index_type = 'bai';
	        var nref = readInt(uncba, 4);

		bam.indices = [];

	        var p = 8;
		for (var ref = 0; ref < nref; ++ref) {
			//console.log('ref_index=' + ref);
			var blockStart = p;
			var nbin = readInt(uncba, p); p += 4;
			//console.log('  nbin=' + nbin);
			//nbin = 5;
			for (var b = 0; b < nbin; ++b) {
				var bin = readInt(uncba, p);
				var nchnk = readInt(uncba, p+4);
				//console.log('    bin=' + bin);
				//console.log('    nchnk=' + nchnk);
				p += 8 + (nchnk * 16);
			}
			var nintv = readInt(uncba, p); p += 4;
			p += (nintv * 8);
			var blockLength = p - blockStart
			//console.log('blockStart=' + blockStart);
			//console.log('blockLength=' + blockLength);
			if (nbin > 0) {
				bam.indices[ref] = new Uint8Array(header, blockStart, blockLength);
			}
		}
	} else if(indexMagic == CSI_MAGIC) {
		bam.index_type = csi'';
		var min_shift = readInt(uncba, 4);
		var depth = readInt(uncba, 8);
		//console.log('min_shift=' + min_shift);
		//console.log('depth=' + depth);
		bam.min_shift = min_shift;
		bam.depth = depth;
		var l_aux = readInt(uncba, 12);
		var nref = readInt(uncba, 16);
		//console.log('l_aux=' + l_aux);
		//console.log('nref=' + nref);

		bam.indices = [];

		var p = 20;
		for (var ref = 0; ref < nref; ++ref) {
			//console.log('ref_index=' + ref);
			var blockStart = p;
			var nbin = readInt(uncba, p); p += 4;
			console.log('ref_idx=' + ref + ' nbin=' + nbin);
			//nbin = 5;
			for (var b = 0; b < nbin; ++b) {
				//console.log('  b=' + b);
				var bin = readInt(uncba, p);
				var loffset = readInt(uncba, p+4);
				var nchnk = readInt(uncba, p+12);
				//console.log('    bin=' + bin);
				//console.log('    loffset=' + loffset);
				//console.log('    nchnk=' + nchnk);
				p += 16 + (nchnk * 16);
			}
			var blockLength = p - blockStart
			//console.log('blockStart=' + blockStart,);
			//console.log('blockLength=' + blockLength);
			if (nbin > 0) {
				bam.indices[ref] = new Uint8Array(header, blockStart, blockLength);
			}
		}
	} else {
		return alert(indexMagic + 'Not a valid index (BAI or CSI) file');
	}
        if (bam.chrToIndex) {
            return callback(bam);
        }
    });
}



BamFile.prototype.blocksForRange = function(refId, min, max, min_shift, depth) {
    var index = this.indices[refId];
    if (!index) {
        return [];
    }

    var intBinsL = reg2bins(min, max, min_shift, depth);

    // We will store chunk_beg and chunk_end of leaf bins separately from other bins
    // leaf nodes start at idx t
    var t = ((1<<depth*3) - 1) / 7;
    var leafChunks = [], otherChunks = [];

    var p = 0;
    var n_bin = readInt(index, 0);

    // Get chunk_beg and chunk_end, from the index, for the bins covering the region
    if (this.index_type == 'bai') {
	    for (var b = 0, p = p+4; b < n_bin; ++b) {
		    var bin = readInt(index, p);
		    //var l
		    var n_chunk = readInt(index, p+4);

		    // Is this bin one covering our region?
		    if (intBinsL.indexOf(bin) == -1) {
			    // No, so skip over the bin
			    p += (n_chunk * 16) + 8;
			    continue;
		    }

		    // Get chunk_beg and chunk_end for each chunk in the bin
		    for (var c = 0, p = p+8; c < n_chunk; ++c, p=p+16) {
			    var cs = readVob(index, p);
			    var ce = readVob(index, p+8);
			    // seperate leaf bins from intermediary bins
			    (bin < t ? otherChunks : leafChunks).push(new Chunk(cs, ce));
		    }
	    }

	    //dlog('leafChunks = ' + miniJSONify(leafChunks));
	    //dlog('otherChunks = ' + miniJSONify(otherChunks));

	    // parse the linear index for the leaf bins pruning away chunks from non-leaf bins which
	    // finish before our region starts
	    var nintv = readInt(index, p);
	    var lowest;
	    var minLin = Math.min(min>>min_shift, nintv - 1), maxLin = Math.min(max>>min_shift, nintv - 1);
	    for (var i = minLin; i <= maxLin; ++i) {
		    var lb =  readVob(index, p + 4 + (i * 8));
		    if (!lb) {
			    continue;
		    }
		    if (!lowest || lb.block < lowest.block || lb.offset < lowest.offset) {
			    lowest = lb;
		    }
	    }
	    // dlog('Lowest LB = ' + lowest);
    } else if(this.index_type =='csi') {
	    var lowest = 0;
	    for (var b = 0, p = p+4; b < n_bin; ++b) {
		    var bin = readInt(index, p);
		    var loffset = readInt(index, p+4);
		    var n_chunk = readInt(index, p+12);

		    // Is this bin one covering our region?
		    if (intBinsL.indexOf(bin) == -1) {
			    // No, so skip over the bin
			    p += (n_chunk * 16) + 16;
			    continue;
		    }

		    // remember the smallest loffset found in the bins covering the range
		    lowest = loffset > lowest ? loffset : lowest;

		    // Get chunk_beg and chunk_end for each chunk in the bin
		    for (var c = 0, p = p+16; c < n_chunk; ++c, p=p+16) {
			    var cs = readVob(index, p);
			    var ce = readVob(index, p+8);
			    // seperate leaf bins from intermediary bins
			    (bin < t ? otherChunks : leafChunks).push(new Chunk(cs, ce));
		    }
	    }
    }
    var prunedOtherChunks = [];
    if (lowest != null) {
        for (var i = 0; i < otherChunks.length; ++i) {
            var chnk = otherChunks[i];
            if (chnk.maxv.block >= lowest.block && chnk.maxv.offset >= lowest.offset) {
                prunedOtherChunks.push(chnk);
            }
        }
    }
    // dlog('prunedOtherChunks = ' + miniJSONify(prunedOtherChunks));
    otherChunks = prunedOtherChunks;

    // combine leaf chuncks with pruned internal chunks
    var intChunks = otherChunks.concat(leafChunks);

    // sort intChunks by block ID and then offset
    intChunks.sort(function(c0, c1) {
        var dif = c0.minv.block - c1.minv.block;
        if (dif != 0) {
            return dif;
        } else {
            return c0.minv.offset - c1.minv.offset;
        }
    });

    // merge neighbouring chunks into a single chunk range
    var mergedChunks = [];
    if (intChunks.length > 0) {
        var cur = intChunks[0];
        for (var i = 1; i < intChunks.length; ++i) {
            var nc = intChunks[i];
            if (nc.minv.block == cur.maxv.block /* && nc.minv.offset == cur.maxv.offset */) { // no point splitting mid-block
		// chunks are neighbors, create a new one with redefined minv and maxv
                cur = new Chunk(cur.minv, nc.maxv);
            } else {
                mergedChunks.push(cur);
                cur = nc;
            }
        }
        mergedChunks.push(cur);
    }
//    dlog('mergedChunks = ' + miniJSONify(mergedChunks));

    return mergedChunks;
}

BamFile.prototype.fetch = function(chr, min, max, callback, options) {
    var thisB = this;

    var chrId = this.chrToIndex[chr];
    var chunks;
    if (chrId === undefined) {
        chunks = [];
    } else {
	//console.log('min_shift=' + thisB.min_shift);
	//console.log('depth=' + thisB.depth);
        chunks = this.blocksForRange(chrId, min, max, thisB.min_shift, thisB.depth);
        if (!chunks) {
            callback(null, 'Error in index fetch');
        }
	//console.log('chunks:' + chunks);
    }
    
    var records = [];
    var index = 0;
    var data;
    var binData = "";

    function tramp() {
        if (index >= chunks.length) {
            if (options && options.raw) {
               return callback(binData);
            } else if (options && options.format) {
               var converted = ""
               records.forEach(function(r) { converted += r.convertTo(options.format); });
               return callback(converted);
            } else {
               return callback(records);
            }
        } else if (!data) {
            // dlog('fetching ' + index);
            var c = chunks[index];
            var fetchMin = c.minv.block;
            var fetchMax = c.maxv.block + (1<<16); // *sigh*
            thisB.data.slice(fetchMin, fetchMax - fetchMin).fetch(function(r) {
                if (options && options.raw)
                   data = r;
                else
                   data = unbgzf(r, c.maxv.block - c.minv.block + 1);
                return tramp();
            }, options);
        } else {
            if (options && options.raw) {
               binData += data;
            } else {
               var ba = new Uint8Array(data);
               thisB.readBamRecords(ba, chunks[index].minv.offset, records, min, max, chrId);
            }
            data = null;
            ++index;
            return tramp();
        }
    }
    tramp();
}

var SEQRET_DECODER = ['=', 'A', 'C', 'x', 'G', 'x', 'x', 'x', 'T', 'x', 'x', 'x', 'x', 'x', 'x', 'N'];
var CIGAR_DECODER = ['M', 'I', 'D', 'N', 'S', 'H', 'P', '=', 'X', '?', '?', '?', '?', '?', '?', '?'];

function BamRecord() {
   
}

BamRecord.prototype.convertTo = function(format) {
 var record = "";
 var keys = [ "readName", "flag", "segment", "pos", "mq", "cigar", "rnext", "pnext", "tlen", "seq", "quals", "tags"   ]
 
 if (format == "sam") {
    for (var i=0; i < keys.length; i++)
        record += this[keys[i]] + '\t'
      // if (keys[i] == 'rnext')
      //   record += this.indexToChr[ keys['rnext']-1 ] + '\t';
      // else
      //   record += this[keys[i]] + '\t'
    record = record.slice(0, record.length-1).trim() + "\n";    
 }  
 
 return record;
}

BamFile.prototype.readBamRecords = function(ba, offset, sink, min, max, chrId) {;
    while (true) {
        var blockSize = readInt(ba, offset);
        var blockEnd = offset + blockSize + 4;
        if (blockEnd >= ba.length) {                     
            return sink;
        }

        var record = new BamRecord();

        var refID = readInt(ba, offset + 4);
        var pos = readInt(ba, offset + 8);
        
        var bmn = readInt(ba, offset + 12);
        var bin = (bmn & 0xffff0000) >> 16;
        var mq = (bmn & 0xff00) >> 8;
        var nl = bmn & 0xff;

        var flag_nc = readInt(ba, offset + 16);
        var flag = (flag_nc & 0xffff0000) >> 16;
        var nc = flag_nc & 0xffff;
        
        record.flag = flag;
    
        var lseq = readInt(ba, offset + 20);
        
        var nextRef  = readInt(ba, offset + 24);
        var nextPos = readInt(ba, offset + 28);
        
        record.rnext = this.indexToChr[ nextRef ];
        record.pnext = nextPos;
        
        var tlen = readInt(ba, offset + 32);
        record.tlen = tlen;
    
        var readName = '';
        for (var j = 0; j < nl-1; ++j) {
            readName += String.fromCharCode(ba[offset + 36 + j]);
        }
    
        var p = offset + 36 + nl;

        var cigar = '';
        for (var c = 0; c < nc; ++c) {
            var cigop = readInt(ba, p);
            cigar = cigar + (cigop>>4) + CIGAR_DECODER[cigop & 0xf];
            p += 4;
        }
        record.cigar = cigar;
    
        var seq = '';
        var seqBytes = (lseq + 1 ) >> 1;
        for (var j = 0; j < seqBytes; ++j) {
            var sb = ba[p + j];
            seq += SEQRET_DECODER[(sb & 0xf0) >> 4];
            seq += SEQRET_DECODER[(sb & 0x0f)];
        }
        // acount for odd sequences and remove last character
        // this is needed b\c each character is a half byte and we are taking a byte at a time
        if (lseq % 2 == 1) seq = seq.slice(0, seq.length-1);
        p += seqBytes;
        record.seq = seq;

        var qseq = '';
        for (var j = 0; j < lseq; ++j) {
            qseq += String.fromCharCode(ba[p + j] + 33);
        }
        p += lseq;
        record.quals = qseq;
        
        record.pos = pos;
        record.mq = mq;
        record.readName = readName;
        record.segment = this.indexToChr[refID];
        record.tags = "";

        while (p < blockEnd) {
            var tag = String.fromCharCode(ba[p]) + String.fromCharCode(ba[p + 1]);
            var type = String.fromCharCode(ba[p + 2]);
            var value;

            if (type == 'A') {
                value = String.fromCharCode(ba[p + 3]);
                p += 4;
            } else if (type == 'i' || type == 'I') {
                value = readInt(ba, p + 3);                
                p += 7;
            } else if (type == 'c' || type == 'C') {
                value = ba[p + 3];
                type = "i";
                p += 4;
            } else if (type == 's' || type == 'S') {
                value = readShort(ba, p + 3);
                type = "i";
                p += 5;
            } else if (type == 'f') {
                value = 0;
                type = "i";
                // throw 'FIXME need floats';
                p += 7;
            } else if (type == 'Z') {
                p += 3;
                value = '';
                for (;;) {
                    var cc = ba[p++];
                    if (cc == 0) {
                        break;
                    } else {
                        value += String.fromCharCode(cc);
                    }
                }
            } else {
                throw 'Unknown type '+ type;
            }
            record[tag] = value;
            record.tags += tag + ":" + type + ":" + value + "\t";
        }
        record.tags = record.tags.trim();

        if (!min || record.pos <= max && record.pos + lseq >= min) {
            if (chrId === undefined || refID == chrId) {
                sink.push(record);
            }
        }
        offset = blockEnd;
    }

    // if (options && options.format)
    //   sink.forEach(function(elem) { data += elem.convertTo(options.format) })
    // else
      
    // Exits via top of loop.
}

function readInt(ba, offset) {
    return (ba[offset + 3] << 24) | (ba[offset + 2] << 16) | (ba[offset + 1] << 8) | (ba[offset]);
}

function readShort(ba, offset) {
    return (ba[offset + 1] << 8) | (ba[offset]);
}

function readVob(ba, offset) {
    var block = ((ba[offset+6] & 0xff) * 0x100000000) + ((ba[offset+5] & 0xff) * 0x1000000) + ((ba[offset+4] & 0xff) * 0x10000) + ((ba[offset+3] & 0xff) * 0x100) + ((ba[offset+2] & 0xff));
    var bint = (ba[offset+1] << 8) | (ba[offset]);
    // if (block == 0 && bint == 0) {
    //     return null;  // Should only happen in the linear index?
    // } else {
        return new Vob(block, bint);
    //}
}

function unbgzf(data, lim) {
    lim = Math.min(lim || 1, data.byteLength - 100);
    var oBlockList = [];
    var ptr = [0];
    var totalSize = 0;

    while (ptr[0] < lim) {
        var ba = new Uint8Array(data, ptr[0], 100); // FIXME is this enough for all credible BGZF block headers?
        var xlen = (ba[11] << 8) | (ba[10]);
        // dlog('xlen[' + (ptr[0]) +']=' + xlen);
        var unc = jszlib_inflate_buffer(data, 12 + xlen + ptr[0], Math.min(65536, data.byteLength - 12 - xlen - ptr[0]), ptr);
        ptr[0] += 8;
        totalSize += unc.byteLength;
        oBlockList.push(unc);
    }

    if (oBlockList.length == 1) {
        return oBlockList[0];
    } else {
        var out = new Uint8Array(totalSize);
        var cursor = 0;
        for (var i = 0; i < oBlockList.length; ++i) {
            var b = new Uint8Array(oBlockList[i]);
            arrayCopy(b, 0, out, cursor, b.length);
            cursor += b.length;
        }
        return out.buffer;
    }
}

//
// Binning (transliterated from SAM1.3 spec)
//

/* calculate bin given an alignment covering [beg,end) (zero-based, half-close-half-open) */
function reg2bin(beg, end, min_shift, depth)
{
	var l, s = min_shift, t = ((1<<depth*3) - 1) / 7;
	for (--end, l = depth; l > 0; --l, s += 3, t -= 1<<l*3)
		if (beg>>s == end>>s) return t + (beg>>s);
	return 0;
}

/* calculate the list of bins that may overlap with region [beg,end) (zero-based) */
//var MAX_BIN = (((1<<18)-1)/7);
function reg2bins(beg, end, min_shift, depth)
{
	var l, t, n, s = min_shift + depth*3, list = [];
	for (--end, l = n = t = 0; l <= depth; s -= 3, t += 1<<l*3, ++l) {
		var b = t + (beg>>s), e = t + (end>>s), i;
		for (i = b; i <= e; ++i) list.push(i);
	}
	return list;
}
