# Interpreting SplitThreader plots

Here we show some examples of patterns you might see in SplitThreader and how we would interpret them.

## SplitThreader basics

The most important pattern to build your intuition in SplitThreader is that the feet of the variant are expected to be on the same side as the higher copy number -- at least for events that do affect the copy number.

![](images/coverage_and_feet_good_example.png)

Some examples:

![](images/pretty_good.png)

![](images/good_translocation.png)

![](images/bad.png)


## Simple deletion

![](images/simple_deletion.png)

## Simple tandem duplication

![](images/simple_tandem_duplication.png)

## Reciprocal

![](images/reciprocal_12_15.png)

Notice that right on top of the black highlighted variant is a yellow line. If you look closely, you can see that the yellow feet stick out in the opposite direction from the black variant on both sides.
These are two variant calls but clearly come from the same event. Basically two sequences are cut and swap partners. That is why there is no coverage change. We see these reciprocal events often in SKBR3 too (the cell line I was studying when I built Ribbon and SplitThreader).

This reciprocal event looks like this in Ribbon:

![](images/reciprocal_in_ribbon.png)

## Problematic

This has no coverage change, but unlike the reciprocal event above, this has no other variants nearby to cancel it out.

![](images/no_cnv_match.png)

It could be just very few reads that show this event, so the next step is to look for whether any reads in Ribbon actually support this event.

## Also problematic

![](images/iffy_cnv_match_partial_at_a_distance.png)

I would be suspicious of this one. This has partial support near one breakpoint, but that copy number change is several coverage bars away from the variant (each bar is a 10kb bin here), not to mention that the other side shows no coverage change at all. That copy number change on top may be better explained by some other variant that we are not seeing here.

# Interpreting Ribbon visualizations

![](images/ribbon_no_annotations.png)

This is a simple translocation in a cancer sample. There are two bams, the top is the normal sample and bottom is the tumor sample. We see the translocation in a subset of the tumor reads only.

First, note that settings refer to multi-read and single-read views, which are here:
![](images/ribbon_views.png)
Clicking a read in the multi-read view shows it in the single-read view below.

It's important to know that in the multi-read view, the alignments will be next to each other if they are from the same read.
![](images/ribbon_reads_support_translocation.png)

## Inverted duplication

I've observed before that inverted duplications don't take place at a single breakpoint but instead a small piece of the sequence (279 bp in this case) is left out of the duplication.

In SplitThreader you can even see it when you zoom in enough:
![](images/splitthreader_inverted_duplication.png)

But in Ribbon you can see the details:
![](images/inverted_duplication_ribbon.png)

Same read shown as a dotplot:
![](images/inverted_duplication_dotplot.png)

## Another compound event

A small sequence is inverted right in the middle of the breakpoint of a larger translocation.
![](images/compound_event.png)
