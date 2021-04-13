
echo Running Ruby Verifier
ruby verify.rb

echo Running Python Verifier
python3.9 verify.py

echo Running Shell Script Verifier
./verify.sh

echo Running Java Verifier
javac -classpath libs/commons-codec-1.15.jar verify.java 
java -classpath libs/commons-codec-1.15.jar:. verify