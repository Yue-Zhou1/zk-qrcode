pragma circom 2.0.0;

template Num2Bits(n){
   signal input in;
   signal output out[n];
   var c1 = 0;

   var e2 = 1;
   for (var i = 0; i<n; i++){
      out[i] <-- (in >> i) & 1;
      out[i] * (out[i] - 1) === 0;
      c1 += out[i] * e2;
      e2 = e2 + e2;
   }
   c1 === in;
}

template LessThan(n) {
   assert(n <= 252);
   signal input in1;
   signal input in2;
   signal output out;

   component n2b = Num2Bits(n+1);

   n2b.in <== in1 + (1<<n) - in2;

   out <== 1-n2b.out[n];
}

template GreaterEqThan(n) {
   signal input in1;
   signal input in2;
   signal output out;

   component lt = LessThan(n);

   lt.in1 <== in2;
   lt.in2 <== in1 + 1;
   lt.out ==> out;
}

component main = GreaterEqThan(32);