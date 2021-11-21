// AlyraDefi2Tests.js 
//Librairies utilisées pour les tests
const { BN, ether } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { assert } = require('chai');

//Artifacts du contrat
const Voting = artifacts.require('Voting');
//Test du smart contract Voting
contract('Voting', function (accounts) {
  //Constantes
  const owner = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];
  const user3 = accounts[3];
  const user4 = accounts[4];

  //variable pour gerer les erreurs
  var erreur = null;

  //Creation d'une nouvelle instance avant chaque test
  beforeEach(async function () {
    this.VotingInstance = await Voting.new({from: owner});
  });
  
  //Tester que le owner du contrat est bien celui attendu
  it('Owner du contrat', async function () {
    //Verification
    expect(await this.VotingInstance.owner()).to.equal(owner);
  });

  //Tester si l'ajout à la whitelist fonctionne 
  it('Ajout à la whitelist', async function () {
    //Appel de la fonction addToMappingWhitelist pour ajouter les utilisateurs à la whitelist
    await this.VotingInstance.addToMappingWhitelist([user1, user2, user3], {from: owner});
    //Verification que les utilisateurs sont présents dans la whitelist
    expect(await this.VotingInstance.isWhitelist(user1)).to.be.true;
    expect(await this.VotingInstance.isWhitelist(user2)).to.be.true;
    expect(await this.VotingInstance.isWhitelist(user3)).to.be.true;
    expect(await this.VotingInstance.isWhitelist(user4)).to.be.false;
  });

  //Tester la fonction qui modifie le statut du Workflow stepProcess
  it('Modifier le status du Workflow', async function () {

    //Test sur workflow correct
    //Verification du status initial
    expect(await this.VotingInstance.actualStatus()).to.be.bignumber.equal("0");
    //Appel de la fonction modifyStepProcess
    await this.VotingInstance.modifyStepProcess("ProposalsRegistrationStarted", {from: owner});
    //Verification du status actuel
    expect(await this.VotingInstance.actualStatus()).to.be.bignumber.equal("1");
    //Appel de la fonction modifyStepProcess
    await this.VotingInstance.modifyStepProcess("ProposalsRegistrationEnded", {from: owner});
    //Verification du status actuel
    expect(await this.VotingInstance.actualStatus()).to.be.bignumber.equal("2");
    //Appel de la fonction modifyStepProcess
    await this.VotingInstance.modifyStepProcess("VotingSessionStarted", {from: owner});
    //Verification du status actuel
    expect(await this.VotingInstance.actualStatus()).to.be.bignumber.equal("3");
    //Appel de la fonction modifyStepProcess
    await this.VotingInstance.modifyStepProcess("VotingSessionEnded", {from: owner});
    //Verification du status actuel
    expect(await this.VotingInstance.actualStatus()).to.be.bignumber.equal("4");
    //Appel de la fonction modifyStepProcess
    await this.VotingInstance.modifyStepProcess("VotesTallied", {from: owner});
    //Verification du status actuel
    expect(await this.VotingInstance.actualStatus()).to.be.bignumber.equal("5");
    //Appel de la fonction newProcess
    await this.VotingInstance.newProcess({from: owner});
    //Verification du status actuel
    expect(await this.VotingInstance.actualStatus()).to.be.bignumber.equal("0");

    //Test sur workflow incorrect
    //Essayer l'execution d'une fonction avec un paramétre incorrect qui doit normalement renvoyer une erreur
    //Erreur : Le workflow n'est pas respecté
    try { await this.VotingInstance.modifyStepProcess("ProposalsRegistrationEnded", {from: owner});}
    //Capturer l'erreur
    catch (err) {erreur = err;}
    finally {
      //Test qui detecte si une erreur à été capturée
      //Si aucune erreur n'est capturée, le test echoue
      if(erreur == null) { assert.fail();}
      //Re-initialisation variable globale erreur
      erreur = null;
    }

    //Erreur : User1 appelle la fonction modifyStepProcess
    try { await this.VotingInstance.modifyStepProcess("ProposalsRegistrationStarted", {from: user1});}
    //Capturer l'erreur
    catch (err) {erreur = err;}
    finally {
      //Si aucune erreur n'est capturée, le test echoue
      if(erreur == null) { assert.fail();}
      //Re-initialisation variable globale erreur
      erreur = null;
    }
  });

  //Tester la fonction makeProposition
  it('Effectuer des Propositions', async function () {
      //Contexte initial
      //Appel de la fonction modifyStepProcess pour ouvrir l'inscription des propositions
      await this.VotingInstance.modifyStepProcess("ProposalsRegistrationStarted", {from: owner});
      //Recuperation de la valeur du compteur au status initial
      let counterBeforeProposition = await this.VotingInstance.displayCounterProposal();
      //Mise en place du compte user1, user2 et user3 sur liste blanche
      await this.VotingInstance.addToMappingWhitelist([user1, user2, user3], {from: owner});
      //Ajout des propositions pour User1 et User4
      let user1InitialProposition = "Proposition User1";
      let user4InitialProposition = "Proposition User4";
      //Debut du test
      await this.VotingInstance.makeProposition(user1InitialProposition, {from: user1});
      //Recuperation de la valeur du compteur après proposition
      let counterAfterProposition = await this.VotingInstance.displayCounterProposal();
      //Condition pour savoir si le compteur fonctionne
      expect(counterAfterProposition).to.be.bignumber.equal("1");
      //Tester que la proposition saisie par user1 est celle contenue dans la blockchain
      let user1Profile = await this.VotingInstance.queryMprofile(user1);
      let user1Proposition = await this.VotingInstance.queryMproposal(user1Profile.myProposalId);
      //Condition du test
      expect(user1InitialProposition).to.equal(String(user1Proposition.description));

      //Test sur proposition incorrecte
      //Erreur : L'emetteur de la proposition ne fait pas parti de la whitelist
      try { await this.VotingInstance.makeProposition(user4InitialProposition, {from: user4});}
      //Capturer l'erreur
      catch (err) {erreur = err;}
      finally {
        //Si aucune erreur n'est capturée, le test echoue
        if(erreur == null) { assert.fail();}
        //Re-initialisation variable globale erreur
        erreur = null;
      }
  });

  //Tester la fonction setVote
  it('Voter pour des propositions', async function () {
      //Contexte initial
      //Appel de la fonction modifyStepProcess pour ouvrir l'inscription des propositions
      await this.VotingInstance.modifyStepProcess("ProposalsRegistrationStarted", {from: owner});
      //Mise en place du compte user1, user2 et user3 sur liste blanche
      await this.VotingInstance.addToMappingWhitelist([user1, user2, user3], {from: owner});
      //Ajout des propositions pour les Users
      let user1InitialProposition = "Proposition User1";
      let user2InitialProposition = "Proposition User2";
      await this.VotingInstance.makeProposition(user1InitialProposition, {from: user1});
      await this.VotingInstance.makeProposition(user2InitialProposition, {from: user2});
      //Appel de la fonction modifyStepProcess pour fermer l'inscription des propositions
      await this.VotingInstance.modifyStepProcess("ProposalsRegistrationEnded", {from: owner});
      //Appel de la fonction modifyStepProcess pour ouvrir le vote
      await this.VotingInstance.modifyStepProcess("VotingSessionStarted", {from: owner});
      //Debut du test
      //variables pour les test
      let voteProposal1 = 1;
      //Recuperation du profil de l'utilisateur
      let user1ProfileBeforeVote = await this.VotingInstance.queryMprofile(user1);
      //Test que l'utilisateur n'a pas encore voté
      expect(user1ProfileBeforeVote.hasVoted).to.be.false;
      //Vote de User1
      await this.VotingInstance.setVote(voteProposal1, {from: user1});
      //Nouvelle récuperation du profil de l'utilisateur
      let user1ProfileAfterVote = await this.VotingInstance.queryMprofile(user1);
      //Tester que l'utilisateur a voté
      expect(user1ProfileAfterVote.hasVoted).to.be.true;
      //Tester que le vote saisi est bien celui inscrit dans la blockchain
      expect(user1ProfileAfterVote.votedProposalId).to.equal(String(voteProposal1));

      //Test sur proposition incorrecte
      //Erreur : L'emetteur du vote a deja voté
      try { await this.VotingInstance.setVote(voteUser1, {from: user1});}
      //Capturer l'erreur
      catch (err) {erreur = err;}
      finally {
        //Si aucune erreur n'est capturée, le test echoue
        if(erreur == null) { assert.fail();}
        //Re-initialisation variable globale erreur
        erreur = null;
      }

      //Test sur proposition incorrecte
      //Erreur : L'id du vote n'existe pas dans la blockchain
      try { await this.VotingInstance.setVote(10, {from: user1});}
      //Capturer l'erreur
      catch (err) {erreur = err;}
      finally {
        //Si aucune erreur n'est capturée, le test echoue
        if(erreur == null) { assert.fail();}
        //Re-initialisation variable globale erreur
        erreur = null;
      }
  });

  //Tester la fonction getWinner
  it('Résultat et annonce du gagnant', async function () {
    //Contexte initial
    //Appel de la fonction modifyStepProcess pour ouvrir l'inscription des propositions
    await this.VotingInstance.modifyStepProcess("ProposalsRegistrationStarted", {from: owner});
    //Mise en place du compte user1, user2 et user3 sur liste blanche
    await this.VotingInstance.addToMappingWhitelist([user1, user2, user3], {from: owner});
    //Ajout des propositions pour les Users
    let user1InitialProposition = "Proposition User1";
    let user2InitialProposition = "Proposition User2";
    await this.VotingInstance.makeProposition(user1InitialProposition, {from: user1});
    await this.VotingInstance.makeProposition(user2InitialProposition, {from: user2});
    //Appel de la fonction modifyStepProcess pour fermer l'inscription des propositions
    await this.VotingInstance.modifyStepProcess("ProposalsRegistrationEnded", {from: owner});
    //Appel de la fonction modifyStepProcess pour ouvrir le vote
    await this.VotingInstance.modifyStepProcess("VotingSessionStarted", {from: owner});
    //Vote des utilisateurs
    let voteProposal1 = 1;
    let voteProposal2 = 2;
    //La proposition numéro 1 comptablise 1 vote et la proposition numéro 2 comptabilise 2 votes
    await this.VotingInstance.setVote(voteProposal2, {from: user2});
    await this.VotingInstance.setVote(voteProposal2, {from: user3});
    //Appel de la fonction modifyStepProcess pour cloturer le vote
    await this.VotingInstance.modifyStepProcess("VotingSessionEnded", {from: owner});
    //Appel de la fonction modifyStepProcess pour indiquer que les resultats sont disponibles
    await this.VotingInstance.modifyStepProcess("VotesTallied", {from: owner});
    //Debut du test
    //Test du vainqueur qui dans ce contexte initial doit etre l'utiliisateur numéro 2
    expect(await this.VotingInstance.getWinner()).to.equal(user2);
  });
});