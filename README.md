# Alyra-2
Alyra Défi #2

AlyraDefi2.sol

  Contient le smart contract 'Voting' du defi #1 auquel j'ai ajouté deux functions :
  
   1: 'function queryMprofile' permettant d'acceder en lecture au mapping 'mprofile'    mapping(address => Voter) mprofile;
   2: 'function queryMproposal' permettant d'acceder en lecture au mapping 'mproposal'    mmapping(uint => Proposal) mproposal;
   
AlyraDefi2Tests.js

  Contient tous les tests unitaires du smart contract 'Voting':
  
  Les fonctions principales sont testées par ordre d'appel dans l'application.
  
