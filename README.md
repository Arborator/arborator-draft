# arborator-draft

Visualization tool for syntactic dependency trees.

## Description

Arborator Draft is a script to visualize your dependency trees in an html file. Written in javascript it uses [D3JS](https://d3js.org/) to create SVG trees.

## Usage 

### Add the script at the bottom

```
<script language="JavaScript" type="text/javascript" src="arborator-draft.js"></script>
```

### Initialize the script

```
<script>
new ArboratorPlugin(); // Start
</script>
```

### Optional settings

```
<script>
var options = {
    labelColor:'#ea2929', // deprel color
    arrowColor : '#000', // arrow color
    wordColor : '#000', // words color
    lemmaColor : '#006400', // color of lemmas
    posColor : '#9e04de', // color of part-of-speech tags
    pathColor : '#000', // color of paths
    pathWidth : 1, // width of syntactic paths
    pathHeight : 23, // height of syntactic paths
    format : {sid : 0, id : 0, word : 1, lemma : 2, pos : 3, head : 6, deprel : 7} // entry format
};
new ArboratorPlugin(options); // Start
</script>
```

## Credits

Kim Gerdes, ILPGA, Sorbonne-Nouvelle

Gaël Guibon, LSIS, Aix-Marseille Université

This work is based on the work of [Herman Leung](http://linguistics.berkeley.edu/~herman/index.php) on the [Parallel Corpus Search Interface Project](http://greeknt.lt.cityu.edu.hk/parallel_web/search.php) and the [Arborator Quick Access](https://arborator.ilpga.fr/q.cgi) from [Kim Gerdes](https://gerdes.fr/).
