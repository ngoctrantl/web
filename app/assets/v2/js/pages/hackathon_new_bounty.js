const hackathon_slug = document.hackathon_slug;
const sponsors = document.sponsors;

Vue.component('v-select', VueSelect.VueSelect);
Vue.mixin({
  methods: {
    getIssueDetails: function(url) {
      let vm = this;

      if (!url) {
        vm.errorIssueDetails = undefined;
        return vm.issueDetails = null;
      }

      if (url.indexOf('github.com/') < 0) {
        vm.issueDetails = null;
        vm.errorIssueDetails = 'Please paste a github issue url';
        return;
      }

      let ghIssueUrl = new URL(url);

      vm.orgSelected = '';

      const apiUrldetails = `/sync/get_issue_details?url=${encodeURIComponent(url)}&hackathon_slug=${vm.hackathon_slug}`;

      vm.errorIssueDetails = undefined;
      vm.issueDetails = undefined;
      const getIssue = fetchData(apiUrldetails, 'GET');

      $.when(getIssue).then((response) => {
        vm.orgSelected = ghIssueUrl.pathname.split('/')[1];

        vm.issueDetails = response;
        vm.errorIssueDetails = undefined;
        // if (response[0]) {
        // } else {
        //   vm.issueDetails = null;
        //   vm.errorIssueDetails = 'This issue wasn\'t bountied yet.';
        // }
      }).catch((err) => {
        console.log(err);
        vm.errorIssueDetails = err.responseJSON.message;
      });

    },
    getTokens: function() {
      let vm = this;
      const apiUrlTokens = '/api/v1/tokens/';
      const getTokensData = fetchData(apiUrlTokens, 'GET');

      $.when(getTokensData).then((response) => {
        vm.tokens = response;
        vm.form.token = vm.filterByNetwork[0];
        vm.getAmount(vm.form.token.symbol);

      }).catch((err) => {
        console.log(err);
        // vm.errorIssueDetails = err.responseJSON.message;
      });

    },
    getAmount: function(token) {
      let vm = this;

      if (!token) {
        return;
      }
      const apiUrlAmount = `/sync/get_amount?amount=1&denomination=${token}`;
      const getAmountData = fetchData(apiUrlAmount, 'GET');

      $.when(getAmountData).then((response) => {
        vm.coinValue = response.usdt;
        vm.calcValues('usd');

      }).catch((err) => {
        console.log(err);
        // vm.errorIssueDetails = err.responseJSON.message;
      });
    },
    calcValues: function(direction) {
      let vm = this;

      if (direction == 'usd') {
        let usdValue = vm.form.amount * vm.coinValue;

        vm.form.amountusd = Number(usdValue.toFixed(2));
        console.log(vm.form.amountusd);
      } else {
        vm.form.amount = Number(vm.form.amountusd * 1 / vm.coinValue).toFixed(4);
        console.log(vm.form.amount);
      }

    },
    addKeyword: function(item) {
      let vm = this;

      vm.form.keywords.push(item);
    },
    checkForm: function(e) {
      let vm = this;

      if (vm.form.bounty_categories.length < 1) {
        vm.errors.push('Select at least one category');
        e.preventDefault();
      } else {
        return;
      }
    },
    submitForm: function() {
      let vm = this;

      if (network === 'mainnnet') {
        // vm.blockchainSend(metadata)
        // vm.sendData(form)

      } else if (network === 'custom') {
        vm.sendData();
      }


    },
    populateMetadata: function() {

      let vm = this;

      const issueDetails = vm.issueDetails;
      const form = vm.form;
      
      const metadata = {
        issueTitle: issueDetails.title,
        issueDescription: issueDetails.description,
        issueKeywords: form.keywords ? form.keywords : '',
        githubUsername: data.githubUsername, // XX
        notificationEmail: data.notificationEmail, // XX
        experienceLevel: form.experience_level,
        projectLength: form.project_length,
        bountyType: form.project_type,
        fundingOrganisation: vm.orgSelected,
        eventTag: vm.hackathon_slug,
        repo_type: 'public',
        tokenName: form.token && form.token.symbol,
        bounty_categories: form.bounty_categories
      };

      return metadata;
    },
    sendData: function() {

      const metadata = populateMetadata();
      let vm = this;

      const form = vm.form;
      
      const params = {
        'title': metadata.issueTitle,
        'amount': form.amount,
        'value_in_token': form.amount * 10 ** form.token.decimals,
        'token_name': metadata.tokenName,
        'token_address': form.token.address,
        'bounty_type': metadata.bountyType,
        'project_length': metadata.projectLength,
        'estimated_hours': metadata.estimatedHours,
        'experience_level': metadata.experienceLevel,
        'github_url': form.gitcoinIssueUrl,
        'bounty_owner_email': metadata.notificationEmail, // XX
        'bounty_owner_github_username': metadata.githubUsername, // XX
        'expires_date': expiresDate, // XX
        'metadata': JSON.stringify(metadata),
        'network': 'mainnet', // XX
        'issue_description': metadata.issueDescription,
        'funding_organisation': metadata.fundingOrganisation,
        'balance': form.amount * 10 ** form.token.decimals, // ETC-TODO REMOVE ?
        'project_type': form.project_type,
        'permission_type': form.permission_type,
        'bounty_categories': metadata.bounty_categories,
        'repo_type': metadata.repo_type,
        'eventTag': metadata.eventTag,
        'auto_approve_workers': data.auto_approve_workers ? 'True' : 'False', // XX
        'web3_type': 'qr',
        'bounty_owner_address': form.funderAddress
      };
    
      const url = '/api/v1/bounty/create';
    
      $.post(url, params, function(response) {
        if (200 <= response.status && response.status <= 204) {
          console.log('success', response);
          window.location.href = response.bounty_url;
        } else if (response.status == 304) {
          _alert('Bounty already exists for this github issue.', 'error');
          console.error(`error: bounty creation failed with status: ${response.status} and message: ${response.message}`);
        } else {
          _alert('Unable to create a bounty. Please try again later', 'error');
          console.error(`error: bounty creation failed with status: ${response.status} and message: ${response.message}`);
        }
      });

    },
    blockchainSend: function() {
      const metadata = populateMetadata();

      let vm = this;
      
      // let ipfsBounty = {
      //   payload: {
      //     title: metadata.issueTitle,
      //     description: metadata.issueDescription,
      //     sourceFileName: '',
      //     sourceFileHash: '',
      //     sourceDirectoryHash: '',
      //     issuer: {
      //       name: metadata.fullName,
      //       email: metadata.notificationEmail,
      //       githubUsername: metadata.githubUsername,
      //       address: '' // Fill this in later
      //     },
      //     schemes: {
      //       project_type: data.project_type,
      //       permission_type: data.permission_type,
      //       auto_approve_workers: !!data.auto_approve_workers
      //     },
      //     hiring: {
      //       hiringRightNow: !!data.hiringRightNow,
      //       jobDescription: data.jobDescription
      //     },
      //     funding_organisation: metadata.fundingOrganisation,
      //     is_featured: metadata.is_featured,
      //     repo_type: metadata.repo_type,
      //     featuring_date: metadata.featuring_date,
      //     privacy_preferences: privacy_preferences,
      //     funders: [],
      //     categories: metadata.issueKeywords.split(','),
      //     created: (new Date().getTime() / 1000) | 0,
      //     webReferenceURL: issueURL,
      //     fee_amount: 0,
      //     fee_tx_id: '0x0',
      //     // optional fields
      //     metadata: metadata,
      //     tokenName: token['name'],
      //     tokenAddress: tokenAddress,

      //   },
      //   meta: {
      //     platform: 'gitcoin',
      //     schemaVersion: '0.1',
      //     schemaName: 'gitcoinBounty'
      //   }
      // };


      // const bounty = web3.eth.contract(bounty_abi).at(bounty_address());

      // ipfs.ipfsApi = IpfsApi(ipfsConfig);
      // ipfs.setProvider(ipfsConfig);
      
      // check if token is authed
      // check balance
      // do_bounty -> deductBountyAmount
    
    }
  },
  computed: {
    sortByPriority: function() {
      // console.log(elem)
      return this.tokens.sort(function(a, b) {
        return b.priority - a.priority;
      });
    },
    filterByNetwork: function() {
      const vm = this;

      if (vm.network == '') {
        return vm.tokens;
      }
      return vm.sortByPriority.filter((item)=>{

        return item.network.toLowerCase().indexOf(vm.network.toLowerCase()) >= 0;
      });
    }
  }
});

if (document.getElementById('gc-hackathon-new-bounty')) {
  // var vueSelect = import('vue-select');
  var app = new Vue({
    delimiters: [ '[[', ']]' ],
    el: '#gc-hackathon-new-bounty',
    components: {
      'vue-select': 'vue-select'
    },
    data() {
      return {
        tokens: [],
        network: 'mainnet',
        hackathon_slug: hackathon_slug,
        issueDetails: undefined,
        errorIssueDetails: undefined,
        errors: [],
        sponsors: sponsors,
        orgSelected: '',
        selected: null,
        coinValue: null,
        form: {
          gitcoinIssueUrl: '',
          bounty_categories: [],
          project_type: '',
          permission_type: '',
          keywords: [],
          amount: 0.001,
          amountusd: null,
          token: {}
        }
      };
    },
    mounted() {
      this.getTokens();
    }
  });
}
