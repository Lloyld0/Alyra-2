//Alyra-Defi_1.sol
// SPDX-License-Identifier: MIT

//Deploiement du contrat en Gaz
//2660918

pragma solidity 0.8.10;

//Importer contrat Ownable - OpenZeppelin installé en local
import "@openzeppelin/contracts/access/Ownable.sol";

//Contrat principal Voting
contract Voting is Ownable {

        constructor() { 
            //Initialiser le compteur de propositions
            counterProposal = 0;
            //Initialiser l'etat du Workflow
            stepProcess = WorkflowStatus.RegisteringVoters;
        }

        //Evenements a suivre
        event VoterRegistered(address voterAddress); 
        event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
        event ProposalRegistered(uint proposalId);
        event Voted(address voter, uint proposalId);

        //Structure de données Voter
        struct Voter {
            //L'adresse est-elle enregistrée
            bool isRegistered;
            //L'adresse a t-elle votée
            bool hasVoted;
            //Quelle est la proposition choisie par l'adresse ?
            uint votedProposalId;
            //Quelle est la proposition proposée par l'adresse ? clé du mapping mproposal
            uint myProposalId;
        }

        //Structure de données Proposition
        struct Proposal {
            //Quel est l'objet de la proposition ?
            string description;
            //Combien de vote a t-elle recolté
            uint voteCount;
            //Quelle est l'adresse du proposant
            address addressVoter;
        }

        //Enumération Etat du vote workflow
        enum WorkflowStatus {
            RegisteringVoters,
            ProposalsRegistrationStarted,
            ProposalsRegistrationEnded,
            VotingSessionStarted,
            VotingSessionEnded,
            VotesTallied
        }

        //Declaration des variables globales
        //Variable pour suivre le process
        WorkflowStatus stepProcess;

        //Initialisation du compteur de propositions
        uint counterProposal;

        //Mapping des votants
        mapping(address => Voter) mprofile;
        
        //Mapping des propositions
        mapping(uint => Proposal) mproposal;

        //Fonction qui recoit un tableau d'adresses à Whitelister
         function addToMappingWhitelist(address[] memory _arrayAddress) public onlyOwner {
             //Parcours du tableau whitelist
            for (uint i = 0; i < _arrayAddress.length; i++ ) {
                //Transformer les donnees du tableau d'adresses en mapping
                mprofile[_arrayAddress[i]].isRegistered = true;
                //Declenche l'evenement d'enregistrement du votant pour le vote
                emit VoterRegistered(_arrayAddress[i]); 
            }      
        }

        //Fonction qui determine si l'adresse est whitelist
        function isWhitelist(address _address) public view returns(bool) {
        //     //Parcours du tableau whitelist
                if(mprofile[_address].isRegistered) {return true;}
                else {return false;}
        }

        //Modifier permettant d'exiger la présence de l'appellant dans la whitelist
        modifier onlyWhitelist {
             require(isWhitelist(msg.sender), "Votre compte n'est pas sur la liste blanche");
            _;
        }

        //Fonction qui compare deux chaines de caractères
        function stringCompare(string memory _string1, string memory _string2) internal pure returns(bool) {
            if((keccak256(abi.encodePacked(_string1))) == (keccak256(abi.encodePacked(_string2)))) {return true;}
            else {return false;}
        }

        //Fonction qui interroge le mapping mprofile et renvoi l'objet Voter
        function queryMprofile(address _address) public view returns(Voter memory) {
            return mprofile[_address];
        }

        //Fonction qui interroge le mapping mproprosal et renvoi l'objet Proposal
        function queryMproposal(uint _uint) public view returns(Proposal memory) {
            return mproposal[_uint];
        }

        //Fonction qui modifie le statut du Workflow stepProcess
        function modifyStepProcess(string calldata _string) external onlyOwner {
            //Stockage du status precedent
            WorkflowStatus previousStatus = stepProcess;
            //Verification que la chaine de caractère est valide (comprise dans WorkflowStatus)
            //Verification que le process ne saute aucunes étapes
            if(stringCompare(_string, "ProposalsRegistrationStarted") && stepProcess == WorkflowStatus.RegisteringVoters) {stepProcess = WorkflowStatus.ProposalsRegistrationStarted;}
            else if(stringCompare(_string, "ProposalsRegistrationEnded") && stepProcess == WorkflowStatus.ProposalsRegistrationStarted) {stepProcess = WorkflowStatus.ProposalsRegistrationEnded;}
            else if(stringCompare(_string, "VotingSessionStarted") && stepProcess == WorkflowStatus.ProposalsRegistrationEnded) {stepProcess = WorkflowStatus.VotingSessionStarted;}
            else if(stringCompare(_string, "VotingSessionEnded") && stepProcess == WorkflowStatus.VotingSessionStarted) {stepProcess = WorkflowStatus.VotingSessionEnded;}
            else if(stringCompare(_string, "VotesTallied") && stepProcess == WorkflowStatus.VotingSessionEnded) {stepProcess = WorkflowStatus.VotesTallied;}
            //Declenche une erreur si la proposition n'est pas valide ou que l'ordre du workflow n'est pas respecté
            else {require(false, "Erreur dans le workflow");}

            //Declenchecement de l'évenement workflow
            emit WorkflowStatusChange(previousStatus, stepProcess);           
        }

        //Fonction qui retourne le statut actuel de stepProcess
        function actualStatus() external view returns(WorkflowStatus) {
            return stepProcess;
        }

        //Fonction qui retourne le nombre de propositions 
        function displayCounterProposal() external view returns(uint) {
            return counterProposal;
        }

        //Fonction d'enregistrement de proposition avec restriction onlyWhitelist
        function makeProposition(string calldata _string) external onlyWhitelist {
            //Vérification que le status d'enregistrement des propositions est ouvert
            require(stepProcess == WorkflowStatus.ProposalsRegistrationStarted, "L'enregistrement des propositions est ferme");
            //Incremente le compteur de proposition
            counterProposal++;
            //Enregistre l'ID de la proposition utilisateur
            mprofile[msg.sender].myProposalId = counterProposal;
            //Enregistre la proposition utilisateur
            mproposal[mprofile[msg.sender].myProposalId].description = _string;
            //Enregistre l'adresse du createur de la proposition
            mproposal[mprofile[msg.sender].myProposalId].addressVoter = msg.sender;
            //Declenchement de l'évenement proposition enregistrée
            emit ProposalRegistered(mprofile[msg.sender].myProposalId);
        }

        //Fonction qui affiche la proposition en cours d'une adresse
        function displayPurposeByAddress(address _address) public view returns(string memory) {
            //Verifit que le compte est sur liste blanche
            require(isWhitelist(_address), "Le compte n'est pas sur la liste blanche");
            //Verifit que le compte a soumis une proposition
            require(mprofile[_address].myProposalId > 0, "L'utilisateur n'a pas encore fait de propositions");
            //Retourne la proposition
            return mproposal[mprofile[_address].myProposalId].description;
        }

        //Fonction qui affiche la proposition en cours par ID
        function displayPurposeByID(uint _id) public view returns(string memory) {
            //Verifier que l'id existe
            require(_id != 0 && _id <= counterProposal, "L'id n'existe pas");
            //Retourne la proposition
            return mproposal[_id].description;
        }

        //Fonction qui enregistre le vote d'une adresse inscrite
        function setVote(uint _id) public onlyWhitelist {
            //Vérification que le status d'enregsitrement des votes est ouvert
            require(stepProcess == WorkflowStatus.VotingSessionStarted, "L'enregistrement des votes est ferme");
            //Verifier que le votant n'a pas deja voté
            require(!mprofile[msg.sender].hasVoted, "Votre vote a deja ete enregistre");
            //Verifier que l'id existe
            require(_id != 0 && _id <= counterProposal, "L'id n'existe pas");
            //Enregistrer que le votant a voter
            mprofile[msg.sender].hasVoted = true;
            //Enregistre quelle proposition est choisie
            mprofile[msg.sender].votedProposalId = _id;
            //Ajoute un vote au compteur de la proposition
            mproposal[_id].voteCount++;
            //Declenchement de l'evenement Vote
            emit Voted(msg.sender, _id);
        }

        //Fonction qui retourne l'adresse du gagnant
        function getWinner() public view returns(address) {
            //Vérification que le status d'enregistrement des votes est ouvert
            require(stepProcess == WorkflowStatus.VotesTallied, "Les resultats ne sont pas encore disponibles");
            //id du gagnant
            uint winner;
            //Plus grand nombre de votes
            uint maxVote = 0;
            //Iterer sur toutes les propositions
            for (uint i = 1; i <= counterProposal; i++ ) {
                //condition pour verifier si le nombre de vote est supérieur au precedant 
                //Afin d'éviter de devoir re-voter, si il y égalité de votes entre plusieurs propositions, c'est la première enregistrée qui est retenue.
                if(mproposal[i].voteCount > maxVote) {
                    //Id du winner
                    winner = i;
                    //Nombre de vote Maximum
                    maxVote = mproposal[i].voteCount;
                }
            }
            //retourne l'adresse du gagnant
            return mproposal[winner].addressVoter;
        }

        //Function qui renvoi la proposition du gagnant
        function proposalOfWinner() public view returns(string memory) {
            // Utilisation de la fonction getWinner
            return displayPurposeByAddress(getWinner());
        }

        //Fonction qui réinitialise le workflow pour une nouvelle session de vote
        function newProcess() public onlyOwner {
            //retour à la première étape du workflow
            stepProcess = WorkflowStatus.RegisteringVoters;
            //ré-initialisation du compteur de propositions
            counterProposal = 0;
        }

}