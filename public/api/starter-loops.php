<?php
// Public demonstration rhythms. Imported only when a new account is created.
if (!defined('BEATS_INTERNAL')) { http_response_code(404); exit; }
return json_decode(<<<'JSON'
[
  {
    "name": "Eighth Note Feel – With Syncopation",
    "bpm": 90,
    "numerator": 4,
    "denominator": 4,
    "bars": [
      {
        "id": "6e6c0eb42adaeb7c69e1c9a68fa3e485",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "9fdd9ebca38713169efbee79e3d9252d",
            "instrument": "hat",
            "muted": false,
            "steps": [
              2,
              0,
              2,
              0,
              2,
              0,
              2,
              0,
              2,
              0,
              2,
              0,
              2,
              0,
              2,
              0
            ]
          },
          {
            "id": "962c58cf691ca8f77ac5241abd63d3d0",
            "instrument": "snare",
            "muted": false,
            "steps": [
              0,
              0,
              0,
              0,
              3,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              3,
              0,
              0,
              0
            ]
          },
          {
            "id": "7ea9a57978a5b887e4ddd89f00a37d3c",
            "instrument": "kick",
            "muted": false,
            "steps": [
              3,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0,
              3,
              0,
              0
            ]
          }
        ]
      },
      {
        "id": "1b75995904dcc9940d98c7ddc247fa51",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "c363ac5e57071bb3cda1dda6867b7820",
            "instrument": "hat",
            "muted": false,
            "steps": [
              2,
              0,
              2,
              0,
              2,
              0,
              2,
              0,
              2,
              0,
              2,
              0,
              2,
              0,
              2,
              0
            ]
          },
          {
            "id": "19e2c739b0fe8ec3f7c288cd09336f48",
            "instrument": "snare",
            "muted": false,
            "steps": [
              0,
              0,
              0,
              0,
              3,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              3,
              0,
              0,
              0
            ]
          },
          {
            "id": "ef9e7800e492c7c445e6db257dab0302",
            "instrument": "kick",
            "muted": false,
            "steps": [
              3,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0,
              3,
              0,
              0
            ]
          }
        ]
      }
    ]
  },
  {
    "name": "Ghost Note Grooves",
    "bpm": 80,
    "numerator": 4,
    "denominator": 4,
    "bars": [
      {
        "id": "3879d7cfcfc72e38ff13a9550d30a00a",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "113862bae9b00ef86ca7112697818d63",
            "instrument": "hat",
            "muted": false,
            "steps": [
              2,
              0,
              2,
              0,
              2,
              2,
              0,
              2,
              0,
              2,
              0,
              0,
              2,
              0,
              2,
              0,
              2,
              2,
              0,
              2,
              0,
              2,
              0,
              0
            ]
          },
          {
            "id": "5052286b04eb6789e097d19af209ef66",
            "instrument": "snare",
            "muted": false,
            "steps": [
              0,
              1,
              0,
              1,
              0,
              0,
              3,
              0,
              1,
              0,
              1,
              1,
              0,
              1,
              0,
              1,
              0,
              0,
              3,
              0,
              1,
              0,
              1,
              1
            ]
          },
          {
            "id": "b6633f1dc565961bf9989e6946b991bb",
            "instrument": "kick",
            "muted": false,
            "steps": [
              3,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      }
    ]
  },
  {
    "name": "Half-Time Shuffle",
    "bpm": 140,
    "numerator": 4,
    "denominator": 4,
    "bars": [
      {
        "id": "a16c2172bec37e1d57443c07d0ec02b1",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "40180d085a4da0a550e1dc87fb6a0395",
            "instrument": "hat",
            "muted": false,
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ]
          },
          {
            "id": "f2d7096d3439ce94ed91729290e01b59",
            "instrument": "snare",
            "muted": false,
            "steps": [
              0,
              1,
              0,
              0,
              1,
              0,
              3,
              1,
              0,
              0,
              1,
              0
            ]
          },
          {
            "id": "343751e8b54f5f3a7e8b5192d93b9cf7",
            "instrument": "kick",
            "muted": false,
            "steps": [
              3,
              0,
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3
            ]
          }
        ]
      },
      {
        "id": "c84f0f340f199a0163d3050e3f8af9cb",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "bd811b955c943bbf2f23dc36a0a4b0b1",
            "instrument": "hat",
            "muted": false,
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ]
          },
          {
            "id": "027dab3f25920590e6c766b43e2cdb90",
            "instrument": "snare",
            "muted": false,
            "steps": [
              0,
              1,
              0,
              0,
              1,
              0,
              3,
              1,
              0,
              0,
              1,
              0
            ]
          },
          {
            "id": "3a56ff083e04fdbf1fb3ed8e41509bf9",
            "instrument": "kick",
            "muted": false,
            "steps": [
              3,
              0,
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3
            ]
          }
        ]
      }
    ]
  },
  {
    "name": "Swing with feathered BD + rim click",
    "bpm": 100,
    "numerator": 4,
    "denominator": 4,
    "bars": [
      {
        "id": "58eb0db233bab69998ab582416a9e68e",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "7e9eece7b9fcad332f063898703cc28f",
            "instrument": "ride",
            "steps": [
              2,
              0,
              0,
              2,
              0,
              2,
              2,
              0,
              0,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "54aadaa91320d38ccfc7be8ebbfe31fc",
            "instrument": "kick",
            "steps": [
              1,
              0,
              0,
              1,
              0,
              0,
              1,
              0,
              0,
              1,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "c10ac44cebec077408add6a1fe22a9a2",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "02bca9313379d2af500a909504a543a0",
            "instrument": "rim",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          }
        ]
      }
    ]
  },
  {
    "name": "Trioly proti rovným osminám",
    "bpm": 80,
    "numerator": 4,
    "denominator": 4,
    "bars": [
      {
        "id": "a1c7bcb0fa8a513ea4e2283f40825a9f",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "cc533eeedd044c5f53ddbffa19b40a51",
            "instrument": "kick",
            "steps": [
              3,
              1,
              2,
              1
            ],
            "muted": false
          },
          {
            "id": "67994c08199bba4a139f2c94be976446",
            "instrument": "hat",
            "steps": [
              2,
              2,
              2,
              2,
              2,
              2,
              2,
              2
            ],
            "muted": false
          },
          {
            "id": "08de6a24a5bdd58332be1d87c4611989",
            "instrument": "ride",
            "steps": [
              2,
              2,
              2,
              2,
              2,
              2,
              2,
              2,
              2,
              2,
              2,
              2
            ],
            "muted": false
          },
          {
            "id": "b6ee18abeb870ff43138f2d9f5392d62",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              0,
              3,
              0,
              0,
              1,
              0,
              0,
              0,
              0,
              3,
              0,
              1,
              0
            ],
            "muted": false
          }
        ]
      }
    ]
  },
  {
    "name": "Blues Shuffle - 12 bars with turnaround",
    "bpm": 100,
    "numerator": 4,
    "denominator": 4,
    "bars": [
      {
        "id": "625d2f294fff7634defd1d835c4dd202",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "2824c0c818ea8d75d87d8aad4a30c29d",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "bd3b04062799987de7675995053ec84e",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "b9ba58c7a701cf199221633c56675934",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "36af271143ba23ecd57309423fe71174",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "dd9fab602f01e9c6bb8a0454adf323c9",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "5191349f09c84c8c2fffb84f065d22db",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "84f98f231a94a7f548911a33b79957e1",
            "instrument": "crash",
            "steps": [
              2,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "63b38e349ca2ddff1e60a1b3732fa598",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "7ba2a8d6eb67b580afcf1f815318e546",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "5142094bb5c3a20a34b437f9ae0c7a81",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "c9c3ce78764dc2ec34f2b7db5154d78f",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "02c9af97249a19bed4442e4aeee494da",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "8fd0b9b0e5728d7e551dba8afeb5e7db",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "4755f680d96a66a28d9ffa4dc0f37b65",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "22f5db5f7e64a349b486ad17b95d9315",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "24d4c3afbf25f74e0113b9b6e97a2e2c",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "d95e9d4a5fde2f039fe2d6524a2332fd",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "404167003237b5ea878ca977f8d8cd4c",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "1d31ffe30b441d303fcb66437bdfc8d8",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "75e082093a6c20fff785def7b4724398",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "0586acd32aa072f634a2099d081deceb",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "dbd14440b38865852c0797dfbf3d484f",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "b0f03d13f0ea4889ae094176048ca3ad",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "51a75b204690d03ce8e2ca4f9546e1bf",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "bf3032f89efde7209edf9234ec706262",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              2,
              2,
              0,
              0,
              0,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "e65b32ab68e8fa59388546e0bdd32eef",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              1,
              3,
              0,
              1
            ],
            "muted": false
          },
          {
            "id": "82cbfc621e9b0dbee03a042668b9ac91",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "db6c44bd1b4503b29c29124884293f12",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "4ba37065c48cf2582c0da30a06a0c8bc",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "2e18c32edfafedf83e4076b598a4e689",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "2187ba99516b25856833c6835142b96e",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "b6128361e8eb16d41b385c350b8b7496",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "2b8437a5264ff9ff9225efb527bd5597",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "ab87245256f26acd5328dfafca5c9f01",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "73c20b2e95a6178ec766fcb673372323",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "1dd9e180383450a87f01c646dd518836",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "6c9234c21a971e2c8388e9923789f380",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "071d73adbecab2b2dd8a9053c684490b",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "853d37cf08bb89f863342aea523f29a6",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "ae8ac03239005e880961db12f856dea0",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "3a0341839693c4620ce6f32f0d16a1dd",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "af2915d1e24016f6e812b5d770a6e1c5",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "60ea910865ffdccffec94b3460e798f6",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "b7dca082a4481fb7fc04da44cf913d0a",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "197b8c59cd452159477b494fa925f486",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "15d38dbcbd168fbc8e5d969c44e149cd",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "e8772f310ebc6b14d983fee3ccf6be4f",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "0e051abf2c21fa9974434c17fef5b7af",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "21a74bbe9c4fe8db57116a6ed9802ce9",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "ea1bb3a55f339ca82715d2d95f7b884f",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "e48512022f66813bb87124437d876a73",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "f1fe1cb53fe52292718c92daac335713",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "dc459fd0e923bde9076bbe300ab6413b",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "2a367f0541c88f5b400812982abf5a45",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "2d178f88393517f9db517329b6a1d9eb",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "6a609c0d9dde2117e5cee55839668aee",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "a711cceee1b12d84d5165ec1a1668c0e",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              2,
              2,
              0,
              0,
              0,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "fcbd234cd96e9878c83a99c662e953ad",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              1,
              3,
              0,
              1
            ],
            "muted": false
          },
          {
            "id": "8a8dc8eac563939186acf3186d5da061",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "752b3068f81ce9e3b7b152208b98c049",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "55d958d269ff038009fe28c68d19da12",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "8eb41b34a9fdb4291cea569ecb73a0af",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "06ff53768b3af0929c8adf8a0fff9eec",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "4cb1adf4cecf0632f611bfeb70e2bae3",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "ad76d4616166b84897dec7f4135b6a72",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "d7ccdfc6a5771f84039364a44887db8a",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "f828c95f98e292615267f3af97a1423e",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "468b6f8bec5f8b403359d41efc015be3",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "24152945ae5ca0e8df1cc43943453ec3",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "fb4e3a168e0fbee8f805f2f24feb4abc",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "ea93c5aa0dcd316f35bd6457e1a2fa36",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "4ba6ce1a3da341373330aba7331b2b1d",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "20b13f368e90bdbb2e48c1ef8ae88ab2",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              2,
              2,
              0,
              0,
              0,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "1213ddf9e9cfdbab4b2fe97be3f5febc",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "4876b066f9e2c56e14d48be8aaf7ca66",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "ef70390f10cb8d3cf52e5f279004d618",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "424337d6fbbbfeb460c3221728fd4d9f",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "6e62fb060b7d15defe7d49b3f8ef1adf",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "e9240ef7e4ff92df980636905b0c4d82",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "f3b36cd3f97f75491ee176d5ab0c1d6a",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "b58a998dcaac17705da3136852889f66",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "c96c9d40a0746b5fd65ff929e380e320",
            "instrument": "snare",
            "steps": [
              0,
              0,
              0,
              3,
              0,
              0,
              0,
              0,
              0,
              3,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "275777c073deab3ad63d77d5784f9038",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2,
              2,
              0,
              2
            ],
            "muted": false
          },
          {
            "id": "cfb4fc1dda185da3629da3b23ff8ceeb",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "9fd1d5f25c5e72acea1ab9469f062b20",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "75f6357b193443606e50940d1f0877d9",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "064810be2c14b7afafa5e8efbc5c12c6",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      },
      {
        "id": "6879fa2a714a6cdcb3bc01a562706f46",
        "numerator": 4,
        "denominator": 4,
        "rows": [
          {
            "id": "bef2db6e0e945439f8d83374305809b5",
            "instrument": "kick",
            "steps": [
              3,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "b3069af37a58720c34945c5623e8109a",
            "instrument": "snare",
            "steps": [
              2,
              0,
              1,
              3,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "cf8da67a02bbc99a3cf5c6510da9e45b",
            "instrument": "ride",
            "steps": [
              2,
              0,
              2,
              2,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "e2a8d44a8567a6073daedcdc07553878",
            "instrument": "pedalHat",
            "steps": [
              0,
              0,
              0,
              2,
              0,
              0,
              0,
              0,
              0,
              2,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "c70a8b04fd12ceb275c70b8a041052f5",
            "instrument": "tomHigh",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              2,
              2,
              3,
              0,
              0,
              0
            ],
            "muted": false
          },
          {
            "id": "be288de926dfd2c15c3cb616d8868984",
            "instrument": "tomLow",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              2,
              2,
              3
            ],
            "muted": false
          },
          {
            "id": "2126b9f22fac9a7415894c96852d104d",
            "instrument": "crash",
            "steps": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            "muted": false
          }
        ]
      }
    ]
  }
]
JSON, true, 512, JSON_THROW_ON_ERROR);
