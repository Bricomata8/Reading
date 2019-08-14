#!/usr/bin/perl


if ($#ARGV != 0) {
 print "usage: ./make.pl TEXFILE \n";
 exit;
}
$file = $ARGV[0];
$texfile = $file . ".tex";
$auxfile = $file . ".aux";
$pdffile = $file . ".pdf";


system ("rm -f *.aux *.synctex.gz *.toc *.log *.blg *.bbl *.dvi *.out *.bak *.nav *.snm *.vrb *~ '#'*");
system ("pdflatex $texfile");
system ("pdflatex $texfile");
system ("rm -f *.aux *.synctex.gz *.toc *.log *.blg *.bbl *.dvi *.out *.bak *.nav *.snm *.vrb *~ '#'*");
system ("evince $pdffile &");
system ("ls -ght");
