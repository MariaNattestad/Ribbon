// extending Thomas Down's original BAM js work

var Bam = Class.extend({

   init: function(bamUri, options) {
      this.bamUri = bamUri;
      this.ssl = false;
      this.options = options; // *** add options mapper ***
      // test if file or url
      if (typeof(this.bamUri) == "object") {
         this.sourceType = "file";
         this.bamBlob = new BlobFetchable(bamUri);
         this.baiBlob = new BlobFetchable(this.options.bai); // *** add if statement if here ***
         this.promises = [];
         this.bam = undefined;
         var me = this;
         makeBam(this.bamBlob, this.baiBlob, function(bam) {
            me.setHeader(bam.header);
            me.provide(bam);
         });
      } else if ( this.bamUri.slice(0,4) == "http" ) {
         this.sourceType = "url";
      }

      // set iobio servers
      this.iobio = {}

      // this.iobio.samtools = "wss://services.iobio.io/samtools/";
      // this.iobio.bamReadDepther = "services.iobio.io/bamreaddepther/";
      // this.iobio.bamstatsAlive = "wss://services.iobio.io/bamstatsalive/";

      this.iobio.samtools = "nv-prod.iobio.io/samtools/";
      this.iobio.bamReadDepther = "nv-prod.iobio.io/bamreaddepther/";
      this.iobio.bamstatsAlive = "nv-prod.iobio.io/bamstatsalive/";

      // this.iobio.samtools = "localhost:8060";
      // this.iobio.bamReadDepther = "localhost:8021";
      // this.iobio.bamstatsAlive = "localhost:7100";

      return this;
   },

   fetch: function( name, start, end, callback, options ) {
      var me = this;
      // handle bam has been created yet
      if(this.bam == undefined) // **** TEST FOR BAD BAM ***
         this.promise(function() { me.fetch( name, start, end, callback, options ); });
      else
         this.bam.fetch( name, start, end, callback, options );
   },

   promise: function( callback ) {
      this.promises.push( callback );
   },

   provide: function(bam) {
      this.bam = bam;
      while( this.promises.length != 0 )
         this.promises.shift()();
   },

   _makeid: function() {
      // make unique string id;
       var text = "";
       var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

       for( var i=0; i < 5; i++ )
           text += possible.charAt(Math.floor(Math.random() * possible.length));

       return text;
   },

   _getBamCmd: function(regions) {
      var me = this;
      var regArr = regions.map(function(d) { return d.name+ ":"+ d.start + '-' + d.end;});
      var regStr = JSON.stringify(regions.map(function(d) { return {start:d.start,end:d.end,chr:d.name};}));

      if ( this.sourceType == "url") {
        var cmd = new iobio.cmd(
            this.iobio.samtools,
            ['view', '-b', this.bamUri, regArr.join(' ')],
            { ssl:this.ssl, 'urlparams': {'encoding':'binary'} }
          )
      } else {
          var cmd = new iobio.cmd(
            this.iobio.samtools,
            ['view', '-S', '-b', me.bamUri],
            {
              ssl:this.ssl,
              'urlparams': {'encoding':'binary'},
              writeStream: function(stream) {
                var ended = 0;
                stream.write(me.header.toStr);
                for (var i=0; i < regions.length; i++) {
                  var region = regions[i];
                   me.convert('sam', region.name, region.start, region.end, function(data,e) {
                      stream.write(data);
                      ended += 1;
                      if ( regions.length == ended) stream.end();
                   }, {noHeader:true});
                }
              }
          })
      }

      cmd = cmd.pipe(
              this.iobio.bamstatsAlive,
              ['-u', '500', '-k', '1', '-r', regStr],
              { ssl:this.ssl, urlparams: {cache:'stats.json', partialCache:true}}
            );


      if (window.lastCmd) {
        window.lastCmd.closeClient();
      }
      window.lastCmd = cmd;
      return cmd;
   },

   _generateExomeBed: function(id) {
      var bed = "";
      var readDepth = this.readDepth[id];
      var start, end;
      var sum =0;
      // for (var i=0; i < readDepth.length; i++){
      //    sum += readDepth[i].depth;
      // }
      // console.log("avg = " + parseInt(sum / readDepth.length));
      // merge contiguous blocks into a single block and convert to bed format
      for( var i=0; i < readDepth.length; i++){
         if (readDepth[i].depth < 20) {
            if (start != undefined)
               bed += id + "\t" + start + "\t" + end + "\t.\t.\t.\t.\t.\t.\t.\t.\t.\n"
            start = undefined;
         }
         else {
            if (start == undefined) start = readDepth[i].pos;
            end = readDepth[i].pos + 16384;
         }
      }
      // add final record if data stopped on non-zero
      if (start != undefined)
         bed += id + "\t" + start + "\t" + end + "\t.\t.\t.\t.\t.\t.\t.\t.\t.\n"
      return bed;
   },

   _tmp: function(ref, regions, bed){
      var me = this;
      var bedRegions = [];
      var a = this._bedToCoordinateArray(ref, bed);
      regions.forEach(function(reg) {
         var start = reg.start
         var length = reg.end - reg.start;
         var ci = me._getClosestValueIndex(a, reg.start); // update lo start value
         var maxci = a.length;
         while(length > 0 && ci < maxci) {
            var newStart,newEnd;

            // determine start position
            if ( a[ci].start <= start ) newStart = start;
            else newStart = a[ci].start;

            // determine end position
            if ( a[ci].end >=  newStart+length ) newEnd = newStart+length
            else { newEnd = a[ci].end; ci += 1; }

            // update length left to sample
            length -= newEnd - newStart;
            // push new regions
            bedRegions.push({ name:reg.name, 'start':newStart, 'end':newEnd});
         }
      })
      return bedRegions;
   },

   _mapToBedCoordinates: function(regions, bed) {

      var bedRegions = [];
      var currRef;

      var me = this;

      var a,
          a_i;

      regions.forEach(function(reg){
        if (currRef != reg.name) {
          currRef = reg.name;
          a = me._bedToCoordinateArray(reg.name, bed);
          a_i = 0;
          if (a.length == 0) {
            alert("Bed file doesn't have coordinates for reference: " + reg.name + ". Ignoring it");
            return null;
          }
        }

         for (a_i; a_i < a.length; a_i++) {
            if (a[a_i].end > reg.end)
               break;

            if (a[a_i].start >= reg.start)
               bedRegions.push( {name:reg.name, start:a[a_i].start, end:a[a_i].end})
         }
      })
      return bedRegions
   },

   _bedToCoordinateArray: function(ref, bed) {
      var me = this;
      var a = [];
      bed.split("\n").forEach(function(line){
        if (line[0] == '#' || line == "") return;

        var fields = line.split("\t");
        if (me._referenceMatchesBed(ref, fields[0])) {
           a.push({ chr:ref, start:parseInt(fields[1]), end:parseInt(fields[2]) });
        }
      });
      return a;
   },

   _referenceMatchesBed: function(ref, bedRef) {
      if (ref == bedRef) {
        return true;
      }
      // Try stripping chr from reference names and then comparing
      ref1 = ref.replace(/^chr?/,'');
      bedRef1 = bedRef.replace(/^chr?/,'');

      return (ref1 == bedRef1);
   },

   _getClosestValueIndex: function(a, x) {
       var lo = -1, hi = a.length;
       while (hi - lo > 1) {
           var mid = Math.round((lo + hi)/2);
           if (a[mid].start <= x) {
               lo = mid;
           } else {
               hi = mid;
           }
       }
       if (lo == -1 ) return 0;
       if ( a[lo].end > x )
           return lo;
       else
           return hi;
   },

   getReferencesWithReads: function(callback) {
      var refs = [];
      var me = this;
      if (this.sourceType == 'url') {

      } else {
         this.getHeader(function(header) {
            for (var i=0; i < header.sq.length; i++) {
               if ( me.bam.indices[me.bam.chrToIndex[header.sq[i].name]] != undefined )
                  refs.push( header.sq[i] );
            }
            callback(refs);
         })
      }
   },

   // *** bamtools functionality ***

   convert: function(format, name, start, end, callback, options) {
      // Converts between BAM and a number of other formats
      if (!format || !name || !start || !end)
         return "Error: must supply format, sequenceid, start nucleotide and end nucleotide"

      if (format.toLowerCase() != "sam")
         return "Error: format + " + options.format + " is not supported"
      var me = this;
      this.fetch(name, start, end, function(data,e) {
         if(options && options.noHeader)
            callback(data, e);
         else {
            me.getHeader(function(h) {
               callback(h.toStr + data, e);
            })
         }
      }, { 'format': format })
   },

   count: function() {
      // Prints number of alignments in BAM file(s)
   },

   coverage: function() {
      // Prints coverage statistics from the input BAM file
   },

   filter: function() {
      // Filters BAM file(s) by user-specified criteria
   },

   estimateBaiReadDepth: function(callback) {
      var me = this, readDepth = {};
      me.readDepth = {};

      function cb(done) {
         if (me.header) {
            for (var id in readDepth) {
              if (readDepth.hasOwnProperty(id))
              var name = me.header.sq[parseInt(id)].name;
               if ( me.readDepth[ name ] == undefined){
                  me.readDepth[ name ] = readDepth[id];
                  callback( name, readDepth[id], done );
               }
            }
         }
      }


      me.getHeader(function(header) {
            cb();
      });
      if ( Object.keys(me.readDepth).length > 0 )
         callback(me.readDepth)
      else if (me.sourceType == 'url') {
          var currentSequence;
          var cmd = new iobio.cmd(this.iobio.bamReadDepther, [ '-i', me.bamUri + ".bai"], {ssl:this.ssl,})
          cmd.on('error', function(e){ console.log(e); });
          cmd.on('data', function(data, options) {
             data = data.split("\n");
             for (var i=0; i < data.length; i++)  {
                if ( data[i][0] == '#' ) {
                   var numRefs = Object.keys(readDepth).length;
                   if ( numRefs > 0 && ((numRefs+3) % 3 ==0) ) { cb() };
                   var fields = data[i].substr(1).split("\t");
                   currentSequence = fields[0]
                   readDepth[currentSequence] = [];
                   if (fields[1]) {
                     readDepth[currentSequence].mapped = +fields[1];
                     readDepth[currentSequence].unmapped = +fields[2];
                   }
                }
                else if (data[i][0] == '*') {
                  window.bam.n_no_coor = +data[i].split("\t")[2];
                }
                else {
                   if (data[i] != "") {
                      var d = data[i].split("\t");
                      readDepth[currentSequence].push({ pos:parseInt(d[0]), depth:parseInt(d[1]) });
                   }
                }
             }
          });
          cmd.on('end', function() {
             cb(true);
          });
          cmd.run();

      } else if (me.sourceType == 'file') {
          me.baiBlob.fetch(function(header){
             if (!header) {
                  return dlog("Couldn't access BAI");
              }

              var uncba = new Uint8Array(header);
              var baiMagic = readInt(uncba, 0);
              if (baiMagic != BAI_MAGIC) {
                  return dlog('Not a BAI file');
              }
              var nref = readInt(uncba, 4);

              bam.indices = [];
              var p = 8;

              for (var ref = 0; ref < nref; ++ref) {
                  var bins = [];
                  var blockStart = p;
                  var nbin = readInt(uncba, p); p += 4;
                  if (nbin > 0) readDepth[ref] = [];
                  for (var b = 0; b < nbin; ++b) {
                      var bin = readInt(uncba, p);
                      var nchnk = readInt(uncba, p+4);
                      p += 8;
                      // p += 8 + (nchnk * 16);
                      var byteCount = 0;
                      for (var c=0; c < nchnk; ++c) {
                         var startBlockAddress = readVob(uncba, p);
                         var endBlockAddress = readVob(uncba, p+8);
                         p += 16;
                         byteCount += (endBlockAddress.block - startBlockAddress.block);
                      }
                     if ( bin >=  4681 && bin <= 37449) {
                        var position = (bin - 4681) * 16384;
                        readDepth[ref][bin-4681] = {pos:position, depth:byteCount};
                        // readDepth[ref].push({pos:position, depth:byteCount});
                       //bins[bin - 4681] = byteCount;
                     }
                  }
                  var nintv = readInt(uncba, p); p += 4;
                  p += (nintv * 8);

                  if (nbin > 0) {
                     for (var i=0 ; i < readDepth[ref].length; i++) {
                        if(readDepth[ref][i] == undefined)
                           readDepth[ref][i] = {pos : (i+1)*16000, depth:0};
                     }
                  }
                  // Sort by position of read; otherwise, we get a wonky
                  // line chart for read depth.  (When a URL is provided,
                  // bamtools returns a sorted array.  We need this same
                  // behavior when the BAM file is loaded from a file
                  // on the client.
                  if (readDepth[ref] != undefined) {
                  readDepth[ref] = readDepth[ref].sort(function(a,b) {
                      var x = a.pos;
                      var y = b.pos;
                      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                   });
                }
              }

              // Invoke Callback function
              cb();
          });
      }

   },

   getHeader: function(callback) {
      var me = this;
      if (me.header)
         callback(me.header);
      else if (me.sourceType == 'file')
         me.promise(function() { me.getHeader(callback); })
      else {
          var rawHeader = ""
          var cmd = new iobio.cmd(this.iobio.samtools,['view', '-H', this.bamUri], {ssl:this.ssl,})
          cmd.on('error', function(error) {
            console.log(error);
          })
          cmd.on('data', function(data, options) {
             rawHeader += data;
          });
          cmd.on('end', function() {
             me.setHeader(rawHeader);
             callback( me.header);
          });

          cmd.run();

      }

      // need to make this work for URL bams
      // need to incorporate real promise framework throughout
   },

   setHeader: function(headerStr) {
      var header = { sq:[], toStr : headerStr };
      var lines = headerStr.split("\n");
      for ( var i=0; i<lines.length > 0; i++) {
         var fields = lines[i].split("\t");
         if (fields[0] == "@SQ") {
            var fHash = {};
            fields.forEach(function(field) {
              var values = field.split(':');
              fHash[ values[0] ] = values[1]
            })
            header.sq.push({name:fHash["SN"], end:1+parseInt(fHash["LN"])});
         }
      }
      this.header = header;
   },


   sampleStats: function(callback, options) {
      var binSize = 10000;
      var binNumber = 20;
      if (window.sampling == 'low') {
        binSize = 5000;
        binNumber = 20;
      }
      if (window.sampling == 'verylow') {
        binSize = 2500;
        binNumber = 10;
      }
      // Prints some basic statistics from sampled input BAM file(s)
      options = $.extend({
         'binSize' : binSize, // defaults
         'binNumber' : binNumber,
         start : 1,
      },options);
      var me = this;

      function goSampling(SQs) {
         var regions = [];
         var bedRegions;
         //for (var j=0; j < SQs.length; j++) {
            var sqStart = options.start;
            var length = SQs.length == 1 ? SQs[0].end - sqStart : null;
            if ( length &&  length < options.binSize * options.binNumber) {
               SQs[j].start = sqStart;
               regions.push(SQs[j])
            } else {
               // create random reference coordinates
               var regions = [];
               for (var i=0; i < options.binNumber; i++) {
                  var seq = SQs[Math.floor(Math.random()*SQs.length)]; // randomly grab one seq
                  length = seq.end - sqStart;
                  var s=sqStart + parseInt(Math.random()*length);
                  regions.push( {
                     'name' : seq.name,
                     'start' : s,
                     'end' : s+options.binSize
                  });
               }
               // sort by start value
               regions = regions.sort(function(a,b) {
                  if (a.name == b.name)
                    return ((a.start < b.start) ? -1 : ((a.start > b.start) ? 1 : 0));
                  else
                    return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
               });

               // map random region coordinates to bed coordinates
               if (options.bed != undefined)
                  bedRegions = me._mapToBedCoordinates(regions, options.bed)
            }
         //}

         var r = bedRegions || regions;
         var cmd = me._getBamCmd( r )

         var buffer = "";

        cmd.on('error', function(err) {
          console.log(err);
        })

        cmd.on('queue', function(q) {
          console.log('queue = ' + q);
        })

        cmd.on('data', function(datas, options) {
           datas.split(';').forEach(function(data) {
             if (data == undefined || data == "\n") return;
             var success = true;
             try {

               var obj = JSON.parse(buffer + data)
             } catch(e) {
               success = false;
               buffer += data;
             }
             if(success) {
               buffer = "";
               callback(obj);
             }
          });
        });

        cmd.on('end', function() {
           if (options.onEnd != undefined)
              options.onEnd();

            console.log('command ending')
        });

        cmd.on('exit', function(code) {
          console.log('command exits with code: ' + code);
        })

        cmd.run();

      }

      if ( options.sequenceNames != undefined && options.sequenceNames.length == 1 && options.end != undefined) {
         goSampling([{name:options.sequenceNames[0], end:options.end}]);
      } else  if (options.sequenceNames != undefined){
         this.getHeader(function(header){
            var seqs = options.sequenceNames.map(function(sq) {
              return header.sq.find( function(d) { return (d.name == sq) })
            })

            goSampling( seqs );
         });
      } else {
         this.getHeader(function(header){
            goSampling(header.sq);
         });
         // this.getReferencesWithReads(function(refs) {
         //    goSampling(refs);
         // })
      }
   }

});