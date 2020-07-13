![Arborator-Draft](https://repository-images.githubusercontent.com/101870663/5bb5f100-a9d5-11ea-8f87-358b9a26e2a7)


# Arborator-Draft

Visualization tool for syntactic dependency trees.

## Description

Arborator Draft makes it easy to add dependency trees to your webpage. 

It's written in javascript and uses [D3JS](https://d3js.org/) to create SVG trees.

Check out how it looks by downloading the whole folder and opening example_arborator-draft.html

## Features 
- Arborator Draft handles CoNLL-U files, including features and extended dependency relations.
- The raw CoNLL data can be shown
- Each dependency tree can be downloaded as svg or png image file.
- You decide globally or on a per tree basis which features appear under the token. Simply add such metafeatures to your conll: # shownfeatures = FORM, UPOS, LEMMA, MISC.Gloss, FEATS.ExtPos
- Arborator Draft is used in the [Surface-Syntactic Universal Dependencies annotation guidelines](https://surfacesyntacticud.github.io/guidelines/u/)

## Usage 

- Simply put the CoNLL-U data between &lt;conll&gt; tags where you want to show the dependency graph.
- Import arborator-draft.css, arborator-draft.js, d3.js, and jquery, see details below how to do that.
- Add this code at the end of your page:

```
<script>
new ArboratorDraft();
</script>
```
That's it. All the CoNLL data appears nicely rendered as dependency graphs.

### Details:

To import the necessary scripts, put the files next to your page and add this to your webpage:

```
<link rel="stylesheet" href="arborator-draft.css" type="text/css" />

<script src="d3.js"></script>
<script src="jquery-3.2.1.min.js"></script>

<script language="JavaScript" type="text/javascript" src="arborator-draft.js"></script>
```

If you do not want to put the auxiliary scripts on your own server, you can use CDN:

```
script language="JavaScript" type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/d3/4.10.0/d3.js"></script>
<script src="https://code.jquery.com/jquery-3.2.1.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4=" crossorigin="anonymous"></script>
```

### Graphical options
Graphical options are in arborator-draft.css and can easily be modified there.

### Shown features
If you want to modify which features are shown, modify these lines in the arborator-draft.js:

```
shownfeatures=["FORM", "UPOS", "LEMMA", "MISC.Gloss"];
shownmetas=['text_en'];
```

### More
Check out the example_arborator-draft.html where you can learn how to use this script to produce a big zip-file of svg and png files for a whole treebank at once.

## Credits

Kim Gerdes: ILPGA, Sorbonne-Nouvelle & LPP, Cnrs & Almanach, Inria

Gaël Guibon: Almanach, Inria

This work is based on the work of [Herman Leung](http://linguistics.berkeley.edu/~herman/index.php) on the [Parallel Corpus Search Interface Project](http://greeknt.lt.cityu.edu.hk/parallel_web/search.php) and the [Arborator Quick Access](https://arborator.ilpga.fr/q.cgi) from [Kim Gerdes](https://gerdes.fr/).
